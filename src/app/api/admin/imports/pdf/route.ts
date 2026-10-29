import { NextResponse } from "next/server";
import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { normalizePrefix, PREFIX_PATTERN } from "@/lib/questions/codes";
import { requireApiRole, STAFF_ROLES } from "@/server/auth/session";
import { assertSameOrigin, errorResponse, HttpError } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { audit } from "@/server/audit";
import { newStorageKey, storage } from "@/server/storage";

import { MAX_PDF_BYTES } from "@/server/import/limits";

const bodySchema = z.object({
  sourceId: z.string().max(40).optional(),
  sourceName: z.string().trim().max(120).optional(),
  sourceOwner: z.string().trim().max(120).optional(),
  rights: z.literal(true, { message: "RIGHTS_REQUIRED" }),
  section: z.enum(["RW", "MATH"]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  prefix: z.string().max(20),
  files: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        size: z.number().int().positive().max(MAX_PDF_BYTES),
        role: z.enum(["QUESTIONS", "ANSWER_KEY"]),
      }),
    )
    .min(1)
    .max(20),
});

/**
 * Step 1 of a PDF import: record the rights confirmation, create the batch and
 * return where the browser should upload each file (private storage).
 */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireApiRole(STAFF_ROLES);
    if (!(await rateLimit(`import:${user.id}`, 30, 3600)).ok) throw new HttpError(429, "RATE_LIMITED");

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      if (issue?.path[0] === "rights") throw new HttpError(400, "RIGHTS_REQUIRED");
      if (issue?.path[0] === "files" && issue.code === "too_big") throw new HttpError(413, "FILE_TOO_LARGE");
      throw new HttpError(400, "VALIDATION");
    }
    const b = parsed.data;
    if (!b.files.some((f) => f.role === "QUESTIONS")) throw new HttpError(400, "NO_QUESTION_FILE");
    if (b.files.filter((f) => f.role === "ANSWER_KEY").length > 1) throw new HttpError(400, "VALIDATION");
    if (!b.files.every((f) => f.name.toLowerCase().endsWith(".pdf"))) throw new HttpError(400, "UNSUPPORTED_FILE");
    const prefix = normalizePrefix(b.prefix);
    if (!PREFIX_PATTERN.test(prefix)) throw new HttpError(400, "INVALID_PREFIX");

    const t = await getTranslations("admin.import");
    let sourceId = b.sourceId;
    if (sourceId) {
      const source = await db.source.findUnique({ where: { id: sourceId }, select: { withdrawnAt: true } });
      if (!source) throw new HttpError(400, "SOURCE_REQUIRED");
      if (source.withdrawnAt) throw new HttpError(400, "SOURCE_WITHDRAWN");
    } else {
      if (!b.sourceName || b.sourceName.length < 2 || !b.sourceOwner || b.sourceOwner.length < 2) throw new HttpError(400, "SOURCE_REQUIRED");
      const source = await db.source.create({
        data: { name: b.sourceName, owner: b.sourceOwner, rightsStatement: t("rights"), rightsConfirmedById: user.id, rightsConfirmedAt: new Date() },
      });
      sourceId = source.id;
      await audit(user.id, "source.create", "Source", source.id, { name: source.name, via: "pdf-import" });
    }

    const now = new Date();
    const batch = await db.importBatch.create({
      data: {
        kind: "PDF",
        status: "PENDING",
        sourceId,
        section: b.section,
        defaultDifficulty: b.difficulty,
        codePrefix: prefix,
        rightsConfirmedById: user.id,
        rightsConfirmedAt: now,
        createdById: user.id,
      },
    });
    const uploads = [];
    let order = now.getTime();
    for (const f of b.files) {
      const key = newStorageKey("sources", ".pdf");
      const file = await db.sourceFile.create({
        data: {
          sourceId,
          importBatchId: batch.id,
          kind: f.role === "ANSWER_KEY" ? "ANSWER_KEY_PDF" : "QUESTIONS_PDF",
          storageKey: key,
          originalName: f.name,
          mimeType: "application/pdf",
          sizeBytes: f.size,
          sha256: "",
          uploaded: false,
          uploadedById: user.id,
          uploadedAt: new Date(order++),
        },
      });
      const signed = await storage().signedUploadUrl(key, { expiresInSec: 3600, contentType: "application/pdf" });
      uploads.push({ fileId: file.id, name: f.name, url: signed ?? `/api/admin/uploads/${file.id}`, direct: !!signed });
    }
    await audit(user.id, "import.upload", "ImportBatch", batch.id, { kind: "PDF", files: b.files.map((f) => f.name), rightsConfirmedAt: now.toISOString() });
    return NextResponse.json({ batchId: batch.id, uploads });
  } catch (e) {
    return errorResponse(e);
  }
}
