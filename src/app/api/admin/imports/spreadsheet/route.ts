import { NextResponse } from "next/server";
import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { normalizePrefix, PREFIX_PATTERN } from "@/lib/questions/codes";
import { requireApiRole, STAFF_ROLES } from "@/server/auth/session";
import { assertSameOrigin, errorResponse, HttpError } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { audit } from "@/server/audit";
import { newStorageKey, sha256, storage } from "@/server/storage";
import { analyzeRows, MAX_FILE_BYTES, MAX_ROWS, missingRequiredColumns, readSpreadsheet, spreadsheetKind, summarize } from "@/server/import/spreadsheet";

const formSchema = z.object({
  sourceId: z.string().optional(),
  sourceName: z.string().trim().max(120).optional(),
  sourceOwner: z.string().trim().max(120).optional(),
  rights: z.literal("on", { message: "RIGHTS_REQUIRED" }),
  section: z.enum(["RW", "MATH"]).optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  prefix: z.string().max(20).default(""),
});

/** Step 1 of a spreadsheet import: store the file and check every row. Nothing is created yet. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireApiRole(STAFF_ROLES);
    if (!(await rateLimit(`import:${user.id}`, 30, 3600)).ok) throw new HttpError(429, "RATE_LIMITED");

    const form = await req.formData();
    const parsed = formSchema.safeParse({
      sourceId: form.get("sourceId") || undefined,
      sourceName: form.get("sourceName") || undefined,
      sourceOwner: form.get("sourceOwner") || undefined,
      rights: form.get("rights") ?? undefined,
      section: form.get("section") || undefined,
      difficulty: form.get("difficulty") || undefined,
      prefix: form.get("prefix") ?? "",
    });
    if (!parsed.success) {
      const rights = parsed.error.issues.some((i) => i.path[0] === "rights");
      throw new HttpError(400, rights ? "RIGHTS_REQUIRED" : "VALIDATION");
    }
    const f = parsed.data;
    const prefix = normalizePrefix(f.prefix);
    if (!PREFIX_PATTERN.test(prefix)) throw new HttpError(400, "INVALID_PREFIX");

    const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "UNSUPPORTED_FILE");
    const kind = spreadsheetKind(file.name);
    if (!kind) throw new HttpError(400, "UNSUPPORTED_FILE");
    if (file.size > MAX_FILE_BYTES) throw new HttpError(413, "FILE_TOO_LARGE");
    const bytes = new Uint8Array(await file.arrayBuffer());

    let headers: string[];
    let rows: Awaited<ReturnType<typeof readSpreadsheet>>["rows"];
    try {
      ({ headers, rows } = await readSpreadsheet(bytes, kind));
    } catch {
      throw new HttpError(400, "UNSUPPORTED_FILE");
    }
    const missing = missingRequiredColumns(headers);
    if (missing.length) throw new HttpError(400, "MISSING_COLUMNS", missing.join(", "));
    if (rows.length === 0) throw new HttpError(400, "EMPTY_FILE");
    if (rows.length > MAX_ROWS) throw new HttpError(400, "TOO_MANY_ROWS", String(MAX_ROWS));

    // Source: existing, or a new one created with this upload's rights confirmation.
    const t = await getTranslations("admin.import");
    let sourceId = f.sourceId;
    if (sourceId) {
      const source = await db.source.findUnique({ where: { id: sourceId }, select: { withdrawnAt: true } });
      if (!source) throw new HttpError(400, "SOURCE_REQUIRED");
      if (source.withdrawnAt) throw new HttpError(400, "SOURCE_WITHDRAWN");
    } else {
      if (!f.sourceName || f.sourceName.length < 2 || !f.sourceOwner || f.sourceOwner.length < 2) throw new HttpError(400, "SOURCE_REQUIRED");
      const source = await db.source.create({
        data: { name: f.sourceName, owner: f.sourceOwner, rightsStatement: t("rights"), rightsConfirmedById: user.id, rightsConfirmedAt: new Date() },
      });
      sourceId = source.id;
      await audit(user.id, "source.create", "Source", source.id, { name: source.name, via: "import" });
    }

    const key = newStorageKey("sources", kind === "csv" ? ".csv" : ".xlsx");
    const mime = kind === "csv" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    await storage().put(key, bytes, mime);

    const analyzed = await analyzeRows(rows, { section: f.section ?? null, difficulty: f.difficulty, codePrefix: prefix });
    const now = new Date();
    const sourceFile = await db.sourceFile.create({
      data: {
        sourceId,
        kind: "SPREADSHEET",
        storageKey: key,
        originalName: file.name.slice(0, 200),
        mimeType: mime,
        sizeBytes: bytes.length,
        sha256: sha256(bytes),
        uploadedById: user.id,
      },
    });
    const batch = await db.importBatch.create({
      data: {
        kind: "SPREADSHEET",
        status: "PENDING",
        sourceId,
        section: f.section ?? null,
        defaultDifficulty: f.difficulty,
        codePrefix: prefix,
        totalItems: rows.length,
        log: summarize(analyzed) as unknown as Prisma.InputJsonValue,
        rightsConfirmedById: user.id,
        rightsConfirmedAt: now,
        createdById: user.id,
        fileId: sourceFile.id,
      },
    });
    await audit(user.id, "import.upload", "ImportBatch", batch.id, { file: file.name, rows: rows.length, rightsConfirmedAt: now.toISOString() });
    return NextResponse.json({ batchId: batch.id });
  } catch (e) {
    return errorResponse(e);
  }
}
