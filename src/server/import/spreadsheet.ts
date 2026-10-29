import "server-only";
import siteConfig from "@site";
import en from "../../../messages/en.json";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import {
  assignCodes,
  missingRequiredColumns,
  normalizeHeader,
  normalizeRow,
  parseCsv,
  type ImportDefaults,
  type RawRow,
  type RowResult,
} from "@/lib/import/spreadsheet";
import { findNearDuplicates, fingerprintText } from "@/lib/questions/fingerprint";
import { HttpError } from "@/server/http";
import { IMAGE_TYPES, imageSize, newStorageKey, storage } from "@/server/storage";
import { fetchRemoteImage } from "@/server/fetch-image";
import { questionToSnapshot } from "@/server/questions/service";

export const MAX_ROWS = 2000;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

const englishNames = { domains: en.taxonomy.domains as Record<string, string>, skills: en.taxonomy.skills as Record<string, string> };

export function spreadsheetKind(filename: string): "csv" | "xlsx" | null {
  const ext = filename.toLowerCase().split(".").pop();
  return ext === "csv" ? "csv" : ext === "xlsx" ? "xlsx" : null;
}

export async function readSpreadsheet(bytes: Uint8Array, kind: "csv" | "xlsx"): Promise<{ headers: string[]; rows: RawRow[] }> {
  if (kind === "csv") return parseCsv(new TextDecoder("utf-8").decode(bytes));
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(bytes) as unknown as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) return { headers: [], rows: [] };
  const headerRow = ws.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col] = normalizeHeader(cell.text ?? "");
  });
  const rows: RawRow[] = [];
  ws.eachRow({ includeEmpty: false }, (row, n) => {
    if (n === 1) return;
    const out: RawRow = {};
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      const h = headers[col];
      if (h) out[h] = cell.text ?? "";
    });
    if (Object.values(out).some((v) => v.trim())) rows.push(out);
  });
  return { headers: headers.filter(Boolean), rows };
}

export interface AnalyzedRow extends RowResult {
  nearDuplicateOf?: string[];
  stemExcerpt?: string;
  section?: string;
  domain?: string;
  skill?: string;
  difficulty?: string;
  type?: string;
}

/** Validate rows, assign codes and detect near-duplicates against the bank and within the file. */
export async function analyzeRows(rows: RawRow[], defaults: ImportDefaults): Promise<AnalyzedRow[]> {
  const normalized = rows.map((r, i) => normalizeRow(r, i + 2, defaults, englishNames)); // +2: header is row 1
  const existing = await db.question.findMany({ select: { code: true } });
  const coded = assignCodes(normalized, new Set(existing.map((e) => e.code)), {
    format: siteConfig.questionCodes.format,
    padding: siteConfig.questionCodes.padding,
    codePrefix: defaults.codePrefix,
  });

  const sections = [...new Set(coded.flatMap((r) => (r.row ? [r.row.section] : [])))];
  const bank = sections.length
    ? await db.question.findMany({
        where: { section: { in: sections }, status: { not: "RETIRED" } },
        select: { id: true, code: true, fingerprint: true, section: true },
      })
    : [];

  const seen: { id: string; code: string; fingerprint: string; section: string }[] = [];
  return coded.map((r) => {
    if (!r.row) return r;
    const fp = fingerprintText([r.row.passage, r.row.stem, ...(r.row.choices ?? []).map((c) => c.text)]);
    const candidates = [...bank, ...seen].filter((b) => b.section === r.row!.section);
    const hits = findNearDuplicates(fp, candidates);
    seen.push({ id: `row-${r.rowNumber}`, code: r.code!, fingerprint: fp, section: r.row.section });
    const flags = hits.length && !r.flags.includes("NEAR_DUPLICATE") ? [...r.flags, "NEAR_DUPLICATE" as const] : r.flags;
    return {
      ...r,
      flags,
      nearDuplicateOf: hits.map((h) => h.code),
      stemExcerpt: r.row.stem.slice(0, 140),
      section: r.row.section,
      domain: r.row.domain,
      skill: r.row.skill,
      difficulty: r.row.difficulty,
      type: r.row.type,
    };
  });
}

/** Summary stored on the batch for the preview screen (no full row content). */
export function summarize(rows: AnalyzedRow[]) {
  return rows.map(({ row: _row, ...rest }) => rest);
}

/** Create draft questions for every valid row of a pending batch. */
export async function commitBatch(batchId: string, actor: { id: string }) {
  const batch = await db.importBatch.findUnique({ where: { id: batchId }, include: { file: true, source: true } });
  if (!batch || batch.kind !== "SPREADSHEET" || !batch.file) throw new HttpError(404, "NOT_FOUND");
  if (batch.status !== "PENDING") throw new HttpError(409, "ALREADY_IMPORTED");
  if (batch.source.withdrawnAt) throw new HttpError(422, "SOURCE_WITHDRAWN");

  // Claim the batch so a double click can't import it twice.
  const claimed = await db.importBatch.updateMany({ where: { id: batchId, status: "PENDING" }, data: { status: "PROCESSING" } });
  if (claimed.count === 0) throw new HttpError(409, "ALREADY_IMPORTED");

  try {
    const bytes = await storage().get(batch.file.storageKey);
    if (!bytes) throw new HttpError(500, "FILE_MISSING");
    const { rows } = await readSpreadsheet(bytes, spreadsheetKind(batch.file.originalName) ?? "csv");
    const analyzed = await analyzeRows(rows, {
      section: batch.section,
      difficulty: batch.defaultDifficulty,
      codePrefix: batch.codePrefix ?? "",
    });

    let created = 0;
    const log: unknown[] = [];
    for (const r of analyzed) {
      if (!r.row || !r.code) {
        log.push({ rowNumber: r.rowNumber, errors: r.errors, warnings: r.warnings });
        continue;
      }
      const row = r.row;
      const flags = new Set<string>(r.flags);
      let stem = row.stem;
      let assetId: string | null = null;
      if (row.imageUrl) {
        const img = await fetchRemoteImage(row.imageUrl).catch(() => null);
        if (img) {
          const key = newStorageKey("questions", IMAGE_TYPES[img.type]!);
          await storage().put(key, img.bytes, img.type);
          const size = imageSize(img.bytes, img.type);
          const asset = await db.questionAsset.create({
            data: { storageKey: key, mimeType: img.type, sizeBytes: img.bytes.length, width: size?.width, height: size?.height, alt: "Figure", uploadedById: actor.id },
          });
          assetId = asset.id;
          stem = `![Figure](asset:${asset.id})\n\n${stem}`;
          flags.delete("MISSING_FIGURE");
        } else {
          flags.add("MISSING_FIGURE");
          r.errors.push("IMAGE_FETCH_FAILED" as never);
        }
      }
      const data = {
        code: r.code,
        section: row.section,
        domain: row.domain,
        skill: row.skill,
        difficulty: row.difficulty,
        type: row.type,
        passage: row.passage,
        stem,
        choices: (row.choices ?? undefined) as Prisma.InputJsonValue | undefined,
        correctAnswers: row.correctAnswers,
        explanation: row.explanation,
        wrongChoiceRationales: (row.wrongChoiceRationales ?? undefined) as Prisma.InputJsonValue | undefined,
        tags: row.tags,
      };
      await db.$transaction(async (tx) => {
        const q = await tx.question.create({
          data: {
            ...data,
            status: "DRAFT",
            origin: "IMPORTED",
            flags: [...flags].sort(),
            fingerprint: fingerprintText([row.passage, row.stem, ...(row.choices ?? []).map((c) => c.text)]),
            sourceId: batch.sourceId,
            sourceFileId: batch.fileId,
            sourceRef: String(r.rowNumber),
            importBatchId: batch.id,
            importedById: actor.id,
            importedAt: new Date(),
            createdById: actor.id,
          },
        });
        if (assetId) await tx.questionAsset.update({ where: { id: assetId }, data: { questionId: q.id } });
        await tx.questionVersion.create({
          data: { questionId: q.id, version: 1, snapshot: questionToSnapshot({ ...q }), editedById: actor.id, changeNote: `imported (row ${r.rowNumber})` },
        });
      });
      created++;
      log.push({ rowNumber: r.rowNumber, code: r.code, warnings: r.warnings, flags: [...flags], errors: r.errors });
    }

    await db.importBatch.update({
      where: { id: batchId },
      data: { status: "READY", processedItems: created, log: log as Prisma.InputJsonValue },
    });
    return { created };
  } catch (e) {
    await db.importBatch.update({ where: { id: batchId }, data: { status: "FAILED", error: e instanceof Error ? e.message : "error" } });
    throw e;
  }
}

export { missingRequiredColumns };
