import "server-only";
import siteConfig from "@site";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { domainsForSection, getDomain, isValidSkill, type SectionKey } from "@/lib/taxonomy";
import { codeTemplate, suggestCodes } from "@/lib/questions/codes";
import { computeContentFlags, type Flag } from "@/lib/questions/flags";
import { findNearDuplicates, fingerprintText } from "@/lib/questions/fingerprint";
import { extractFromTextLayer, linesToText } from "@/lib/import/pdf-text";
import { normalizeBox, pageExtractionSchema, type PageExtraction } from "@/lib/import/pdf-schema";
import { answersFor, assembleQuestions, collectKeyEntries, matchAnswers, type AssembledQuestion, type PageResult } from "@/lib/import/assemble";
import { cachedPdf, cropPng, loadPdf, looksLikePdf, MAX_PAGES_PER_FILE, pageTextLines, renderPage } from "@/server/pdf";
import { newStorageKey, sha256, storage } from "@/server/storage";
import { aiAvailable } from "@/server/ai/client";
import { AiExtractionError, extractPageWithAi } from "@/server/ai/extract-page";
import { questionToSnapshot } from "@/server/questions/service";
import { enqueue, JOBS, RetryableJobError, type JobContext } from "@/server/jobs/queue";

/** Long side of the page image shown in the review screen and sent to the AI (Claude's recommended maximum). */
export const PAGE_IMAGE_SIDE = 1568;
/** Long side used when cropping figures, for sharper images. */
const CROP_RENDER_SIDE = 3000;

/** Errors stored on a page; the review screen translates the known codes. */
export class PageError extends Error {}

async function fileBytes(storageKey: string) {
  const bytes = await storage().get(storageKey);
  if (!bytes) throw new PageError("FILE_MISSING");
  return bytes;
}

function docFor(file: { id: string; storageKey: string }) {
  return cachedPdf(file.id, () => fileBytes(file.storageKey));
}

/** Files in document order: question booklets first (in upload order), then answer keys. */
async function orderedFiles(batchId: string) {
  const files = await db.sourceFile.findMany({ where: { importBatchId: batchId }, orderBy: [{ uploadedAt: "asc" }, { originalName: "asc" }] });
  return [...files.filter((f) => f.kind === "QUESTIONS_PDF"), ...files.filter((f) => f.kind === "ANSWER_KEY_PDF")];
}

// ─── 1. Prepare ──────────────────────────────────────────────────────────────

/** Check every uploaded PDF, count its pages and queue one job per page. */
export async function prepareBatch(batchId: string) {
  const claimed = await db.importBatch.updateMany({ where: { id: batchId, status: "PENDING", kind: "PDF" }, data: { status: "PROCESSING", error: null } });
  if (claimed.count === 0) return;

  try {
    const files = await orderedFiles(batchId);
    if (!files.length) throw new PageError("NO_FILES");
    let total = 0;
    for (const file of files) {
      if (!file.uploaded) throw new PageError("UPLOAD_INCOMPLETE");
      const bytes = await fileBytes(file.storageKey);
      if (!looksLikePdf(bytes)) throw new PageError(`NOT_A_PDF:${file.originalName}`);
      let pages: number;
      try {
        const doc = await loadPdf(bytes);
        pages = doc.numPages;
        await doc.loadingTask.destroy();
      } catch (e) {
        const name = (e as { name?: string }).name;
        throw new PageError(name === "PasswordException" ? `PDF_ENCRYPTED:${file.originalName}` : `PDF_INVALID:${file.originalName}`);
      }
      if (pages > MAX_PAGES_PER_FILE) throw new PageError(`TOO_MANY_PAGES:${file.originalName}`);
      await db.sourceFile.update({ where: { id: file.id }, data: { pageCount: pages, sha256: sha256(bytes), sizeBytes: bytes.length } });
      await db.importPage.createMany({
        data: Array.from({ length: pages }, (_, i) => ({
          batchId,
          fileId: file.id,
          role: file.kind === "ANSWER_KEY_PDF" ? ("ANSWER_KEY" as const) : ("QUESTIONS" as const),
          pageNumber: i + 1,
        })),
        skipDuplicates: true,
      });
      total += pages;
    }
    await db.importBatch.update({ where: { id: batchId }, data: { totalItems: total, processedItems: 0 } });
    const pages = await db.importPage.findMany({ where: { batchId }, select: { id: true } });
    for (const p of pages) await enqueue(JOBS.pdfPage, { pageId: p.id });
  } catch (e) {
    await db.importBatch.update({ where: { id: batchId }, data: { status: "FAILED", error: e instanceof Error ? e.message : "PREPARE_FAILED" } });
    if (!(e instanceof PageError)) throw e;
  }
}

// ─── 2. One page ─────────────────────────────────────────────────────────────

/** Render a page, read it (AI if configured, else the text layer) and store the result. */
export async function processPage(pageId: string, ctx: JobContext = { retryCount: 0, retryLimit: 0 }) {
  const page = await db.importPage.findUnique({
    where: { id: pageId },
    include: { file: true, batch: { select: { id: true, section: true, createdById: true, status: true } } },
  });
  if (!page || page.status === "DONE" || page.batch.status !== "PROCESSING") return;
  await db.importPage.update({ where: { id: pageId }, data: { status: "PROCESSING", attempts: { increment: 1 } } });

  try {
    const doc = await docFor(page.file);
    const pdfPage = await doc.getPage(page.pageNumber);
    const lines = await pageTextLines(pdfPage);
    const textLayer = linesToText(lines);
    const image = await renderPage(pdfPage, PAGE_IMAGE_SIDE);
    const imageKey = page.imageKey ?? newStorageKey("imports", ".png");
    await storage().put(imageKey, image.png, "image/png");
    await db.importPage.update({ where: { id: pageId }, data: { imageKey, imageWidth: image.width, imageHeight: image.height, textLayer } });

    // Short pages (answer keys, last pages) are fine; a scan has essentially no text layer.
    const hasText = textLayer.replace(/\s/g, "").length >= 8;
    let extraction: PageExtraction;
    let method: "ai" | "text";
    if (aiAvailable()) {
      const res = await extractPageWithAi({
        png: image.png,
        textLayer: hasText ? textLayer : null,
        role: page.role,
        section: page.batch.section,
        pageNumber: page.pageNumber,
        pageCount: doc.numPages,
        userId: page.batch.createdById,
        pageId,
      });
      extraction = res.extraction;
      method = "ai";
    } else if (hasText) {
      extraction = extractFromTextLayer(lines, { role: page.role, section: page.batch.section });
      method = "text";
    } else {
      throw new PageError("NO_TEXT_LAYER");
    }
    await db.importPage.update({
      where: { id: pageId },
      data: { status: "DONE", method, result: extraction as unknown as Prisma.InputJsonValue, error: null },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const retryable = e instanceof AiExtractionError ? e.retryable : !(e instanceof PageError);
    if (retryable && ctx.retryCount < ctx.retryLimit) {
      await db.importPage.update({ where: { id: pageId }, data: { status: "PENDING", error: message } });
      throw new RetryableJobError(message);
    }
    await db.importPage.update({ where: { id: pageId }, data: { status: "FAILED", error: message } });
  }
  await afterPage(page.batch.id);
}

/** Update progress; when no page is left, queue the final step (once). */
async function afterPage(batchId: string) {
  const [done, open] = await Promise.all([
    db.importPage.count({ where: { batchId, status: { in: ["DONE", "FAILED"] } } }),
    db.importPage.count({ where: { batchId, status: { in: ["PENDING", "PROCESSING"] } } }),
  ]);
  await db.importBatch.update({ where: { id: batchId }, data: { processedItems: done } });
  if (open === 0) await enqueue(JOBS.pdfFinalize, { batchId }, { singletonKey: batchId });
}

// ─── 3. Finalize ─────────────────────────────────────────────────────────────

const PLACEHOLDER = /\[\[FIGURE\s*(\d+)\]\]/gi;

function placeFigures(text: string | null, markdown: Map<number, string>): { text: string | null; used: Set<number> } {
  const used = new Set<number>();
  if (!text) return { text, used };
  const out = text.replace(PLACEHOLDER, (_m, n: string) => {
    const idx = Number(n);
    const md = markdown.get(idx);
    if (md) {
      used.add(idx);
      return md;
    }
    // A figure the reader mentioned but we could not crop: block publishing until fixed.
    return `[[?figure ${idx} missing — add the image]]`;
  });
  return { text: out, used };
}

interface Built {
  q: AssembledQuestion;
  data: {
    section: SectionKey;
    domain: string;
    skill: string;
    type: "MCQ" | "SPR";
    passage: string | null;
    stem: string;
    choices: { key: "A" | "B" | "C" | "D"; text: string }[] | null;
    correctAnswers: string[];
    explanation: string | null;
  };
  assetIds: string[];
  flags: Flag[];
}

/** Crop every figure of the batch into private question images. Returns figure → asset markdown per question. */
async function cropFigures(questions: AssembledQuestion[], uploadedById: string) {
  const byPage = new Map<string, { qi: number; fi: number }[]>();
  questions.forEach((q, qi) =>
    q.figures.forEach((f, fi) => {
      byPage.set(f.pageId, [...(byPage.get(f.pageId) ?? []), { qi, fi }]);
    }),
  );
  const result = questions.map(() => ({ markdown: new Map<number, string>(), byPlacement: new Map<string, string[]>(), assetIds: [] as string[] }));
  for (const [pageId, refs] of byPage) {
    const page = await db.importPage.findUnique({ where: { id: pageId }, include: { file: true } });
    if (!page) continue;
    let rendered: Awaited<ReturnType<typeof renderPage>> | null = null;
    try {
      const doc = await docFor(page.file);
      rendered = await renderPage(await doc.getPage(page.pageNumber), CROP_RENDER_SIDE);
    } catch {
      continue;
    }
    for (const { qi, fi } of refs) {
      const fig = questions[qi]!.figures[fi]!;
      const box = normalizeBox(fig.box);
      if (!box) continue;
      const crop = await cropPng(rendered, box);
      const key = newStorageKey("questions", ".png");
      await storage().put(key, crop.png, "image/png");
      const alt = fig.description.replace(/[[\]\n]/g, " ").trim().slice(0, 200) || "Figure";
      const asset = await db.questionAsset.create({
        data: { storageKey: key, mimeType: "image/png", sizeBytes: crop.png.length, width: crop.width, height: crop.height, alt, uploadedById },
      });
      const md = `![${alt}](asset:${asset.id})`;
      const r = result[qi]!;
      r.markdown.set(fi + 1, md);
      r.byPlacement.set(fig.placement, [...(r.byPlacement.get(fig.placement) ?? []), md]);
      r.assetIds.push(asset.id);
    }
  }
  return result;
}

function buildQuestion(q: AssembledQuestion, section: SectionKey, figs: { markdown: Map<number, string>; byPlacement: Map<string, string[]>; assetIds: string[] }): Built {
  // Domain and skill: the AI's suggestion when it fits the section, otherwise a placeholder. Always to be confirmed.
  const fallback = domainsForSection(section)[0]!;
  const suggested = q.suggestedDomain ? getDomain(q.suggestedDomain) : undefined;
  const domain = suggested && suggested.section === section ? suggested.key : fallback.key;
  const skill = q.suggestedSkill && isValidSkill(domain, q.suggestedSkill) ? q.suggestedSkill : getDomain(domain)!.skills[0]!;

  const used = new Set<number>();
  const place = (text: string | null) => {
    const r = placeFigures(text, figs.markdown);
    r.used.forEach((u) => used.add(u));
    return r.text;
  };
  let passage = place(q.passage);
  let stem = place(q.stem) ?? "";
  const explanation = place(q.explanation);
  const choices = q.type === "MCQ" ? q.choices.map((c) => ({ key: c.key, text: place(c.text) ?? "" })) : null;

  // Figures without a placeholder go at the start of the field they belong to.
  for (const [placement, mds] of figs.byPlacement) {
    const unplaced = mds.filter((md) => ![...used].some((u) => figs.markdown.get(u) === md));
    if (!unplaced.length) continue;
    const block = unplaced.join("\n\n");
    if (placement === "passage") passage = passage ? `${passage}\n\n${block}` : block;
    else if (["A", "B", "C", "D"].includes(placement) && choices) {
      const c = choices.find((x) => x.key === placement);
      if (c) c.text = c.text ? `${block}\n\n${c.text}` : block;
    } else stem = stem ? `${block}\n\n${stem}` : block;
  }

  const data = {
    section,
    domain,
    skill,
    type: q.type,
    passage,
    stem: stem || "[[?question text missing]]",
    choices,
    correctAnswers: answersFor(q),
    explanation,
  };
  const content = computeContentFlags({ ...data, assetCount: figs.assetIds.length });
  return { q, data, assetIds: figs.assetIds, flags: [...new Set<Flag>([...content, "TAXONOMY_UNCONFIRMED"])] };
}

/** Turn all processed pages into draft questions in the review queue. */
export async function finalizeBatch(batchId: string) {
  const claimed = await db.importBatch.updateMany({ where: { id: batchId, status: "PROCESSING" }, data: { status: "FINALIZING" } });
  if (claimed.count === 0) return;
  const batch = await db.importBatch.findUniqueOrThrow({ where: { id: batchId } });
  try {
    const files = await orderedFiles(batchId);
    const fileOrder = new Map(files.map((f, i) => [f.id, i]));
    const pageRows = await db.importPage.findMany({ where: { batchId } });
    pageRows.sort((a, b) => (fileOrder.get(a.fileId) ?? 0) - (fileOrder.get(b.fileId) ?? 0) || a.pageNumber - b.pageNumber);

    const pages: PageResult[] = [];
    for (const p of pageRows) {
      if (p.status !== "DONE") continue;
      const parsed = pageExtractionSchema.safeParse(p.result);
      if (parsed.success) pages.push({ fileId: p.fileId, role: p.role, pageNumber: p.pageNumber, pageId: p.id, extraction: parsed.data });
    }

    const section: SectionKey = batch.section ?? "MATH";
    const assembled = assembleQuestions(pages);
    const stats = matchAnswers(assembled, collectKeyEntries(pages));
    const figures = await cropFigures(assembled, batch.createdById);
    const built = assembled.map((q, i) => buildQuestion(q, section, figures[i]!));

    // Codes: next free numbers per domain for this prefix.
    const codes: string[] = [];
    const reserved = new Set<string>();
    const templates = new Map<string, { existing: string[] }>();
    for (const b of built) {
      const dom = getDomain(b.data.domain)!;
      const t = codeTemplate(siteConfig.questionCodes.format, batch.codePrefix ?? "", dom.code);
      if (!templates.has(t.head)) {
        const existing = await db.question.findMany({ where: { code: { startsWith: t.head } }, select: { code: true } });
        templates.set(t.head, { existing: existing.map((e) => e.code) });
      }
      const [code] = suggestCodes(templates.get(t.head)!.existing, t, siteConfig.questionCodes.padding, 1, reserved);
      reserved.add(code!);
      codes.push(code!);
    }

    // Near-duplicates against the bank and within this import.
    const bank = await db.question.findMany({ where: { section, status: { not: "RETIRED" } }, select: { id: true, code: true, fingerprint: true } });
    const seen: { id: string; code: string; fingerprint: string }[] = [];

    let created = 0;
    for (let i = 0; i < built.length; i++) {
      const b = built[i]!;
      const fingerprint = fingerprintText([b.data.passage, b.data.stem, ...(b.data.choices ?? []).map((c) => c.text)]);
      const flags = [...b.flags];
      if (findNearDuplicates(fingerprint, [...bank, ...seen]).length) flags.push("NEAR_DUPLICATE");
      seen.push({ id: `new-${i}`, code: codes[i]!, fingerprint });
      const now = new Date();
      await db.$transaction(async (tx) => {
        const question = await tx.question.create({
          data: {
            code: codes[i]!,
            ...b.data,
            choices: (b.data.choices ?? undefined) as Prisma.InputJsonValue | undefined,
            difficulty: batch.defaultDifficulty ?? "MEDIUM",
            tags: [],
            status: "DRAFT",
            origin: "IMPORTED",
            flags: [...new Set(flags)].sort(),
            fingerprint,
            sourceId: batch.sourceId,
            sourceFileId: b.q.fileId,
            sourcePage: b.q.pages[0]?.pageNumber ?? null,
            sourceRef: b.q.number,
            importBatchId: batch.id,
            importedById: batch.createdById,
            importedAt: now,
            createdById: batch.createdById,
          },
        });
        if (b.assetIds.length) await tx.questionAsset.updateMany({ where: { id: { in: b.assetIds } }, data: { questionId: question.id } });
        await tx.questionVersion.create({
          data: {
            questionId: question.id,
            version: 1,
            snapshot: questionToSnapshot(question),
            editedById: batch.createdById,
            changeNote: `imported (page ${b.q.pages[0]?.pageNumber ?? "?"}, question ${b.q.number ?? "?"})`,
          },
        });
      });
      created++;
    }

    const failedPages = pageRows
      .filter((p) => p.status === "FAILED")
      .map((p) => ({ fileId: p.fileId, page: p.pageNumber, error: p.error }));
    await db.importBatch.update({
      where: { id: batchId },
      data: {
        status: "READY",
        processedItems: pageRows.length,
        log: {
          created,
          answersFromKey: stats.matched,
          unusedKeyEntries: stats.unusedKeyEntries,
          withoutAnswer: built.filter((b) => b.data.correctAnswers.length === 0).length,
          failedPages,
          methods: { ai: pageRows.filter((p) => p.method === "ai").length, text: pageRows.filter((p) => p.method === "text").length },
        } as Prisma.InputJsonValue,
      },
    });
  } catch (e) {
    await db.importBatch.update({ where: { id: batchId }, data: { status: "FAILED", error: e instanceof Error ? e.message : "FINALIZE_FAILED" } });
    throw e;
  }
}
