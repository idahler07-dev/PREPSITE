import "server-only";
import siteConfig from "@site";
import { db } from "@/lib/db";
import type { Prisma, QuestionOrigin, QuestionStatus } from "@/generated/prisma/client";
import { getDomain } from "@/lib/taxonomy";
import { codeTemplate, suggestCodes } from "@/lib/questions/codes";
import { blockingFlags, computeContentFlags, mergeFlags, type Flag } from "@/lib/questions/flags";
import { findNearDuplicates, fingerprintText } from "@/lib/questions/fingerprint";
import { extractAssetIds } from "@/lib/questions/assets";
import type { Choice, QuestionInput } from "@/lib/questions/schema";
import { HttpError } from "@/server/http";
import { audit } from "@/server/audit";

type Tx = Prisma.TransactionClient;
type Actor = { id: string };

export interface Provenance {
  sourceFileId?: string | null;
  sourcePage?: number | null;
  sourceRef?: string | null;
  importBatchId?: string | null;
  importedById?: string | null;
  importedAt?: Date | null;
}

// TAXONOMY_UNCONFIRMED is not here: it blocks publishing until someone confirms domain and skill.
const PROCESS_FLAGS_CLEARED_ON_APPROVAL: readonly Flag[] = ["NEAR_DUPLICATE", "DUPLICATE_CODE", "STUDENT_REPORT", "DIFFICULTY_MISMATCH"];

export function questionFingerprint(q: { passage?: string | null; stem: string; choices?: Choice[] | null }) {
  return fingerprintText([q.passage, q.stem, ...(q.choices ?? []).map((c) => c.text)]);
}

function snapshot(q: QuestionInput & { status?: QuestionStatus }) {
  return JSON.parse(JSON.stringify(q)) as Prisma.InputJsonValue;
}

function contentData(input: QuestionInput, assetCount: number) {
  return {
    code: input.code,
    section: input.section,
    domain: input.domain,
    skill: input.skill,
    difficulty: input.difficulty,
    type: input.type,
    passage: input.passage,
    stem: input.stem,
    choices: (input.choices ?? undefined) as Prisma.InputJsonValue | undefined,
    correctAnswers: input.correctAnswers,
    explanation: input.explanation,
    wrongChoiceRationales: (input.wrongChoiceRationales ?? undefined) as Prisma.InputJsonValue | undefined,
    tags: input.tags,
    sourceId: input.sourceId ?? null,
    fingerprint: questionFingerprint(input),
    contentFlags: computeContentFlags({ ...input, assetCount }),
  };
}

async function attachAssets(tx: Tx, questionId: string, input: QuestionInput) {
  const ids = extractAssetIds(input.passage, input.stem, input.explanation, ...(input.choices ?? []).map((c) => c.text));
  if (ids.length) {
    await tx.questionAsset.updateMany({
      where: { id: { in: ids }, OR: [{ questionId: null }, { questionId }] },
      data: { questionId },
    });
  }
  return ids.length;
}

async function assertCodeFree(tx: Tx, code: string, exceptId?: string) {
  const clash = await tx.question.findUnique({ where: { code }, select: { id: true } });
  if (clash && clash.id !== exceptId) throw new HttpError(409, "DUPLICATE_CODE", `Code ${code} is already used`);
}

/** Near-duplicates among existing questions in the same section. */
export async function nearDuplicatesOf(fingerprint: string, section: "RW" | "MATH", excludeIds: string[] = []) {
  const others = await db.question.findMany({
    where: { section, id: { notIn: excludeIds }, status: { not: "RETIRED" } },
    select: { id: true, code: true, fingerprint: true },
  });
  return findNearDuplicates(fingerprint, others);
}

export async function createQuestion(
  input: QuestionInput,
  actor: Actor,
  opts: { origin: QuestionOrigin; status?: QuestionStatus; extraFlags?: Flag[]; provenance?: Provenance; isSample?: boolean } = {
    origin: "MANUAL",
  },
) {
  const status = opts.status ?? "DRAFT";
  const { contentFlags, ...data } = contentData(input, 0);
  const dupes = await nearDuplicatesOf(data.fingerprint, input.section);
  const flags = mergeFlags([...(opts.extraFlags ?? []), ...(dupes.length ? (["NEAR_DUPLICATE"] as const) : [])], contentFlags);
  if (status === "PUBLISHED" && blockingFlags(flags).length) throw new HttpError(422, "BLOCKING_FLAGS");

  const question = await db.$transaction(async (tx) => {
    await assertCodeFree(tx, input.code);
    const q = await tx.question.create({
      data: {
        ...data,
        flags,
        status,
        origin: opts.origin,
        isSample: opts.isSample ?? false,
        createdById: actor.id,
        ...(opts.provenance ?? {}),
        ...(status === "PUBLISHED" ? { publishedAt: new Date(), reviewedById: actor.id, reviewedAt: new Date() } : {}),
      },
    });
    const assetCount = await attachAssets(tx, q.id, input);
    if (assetCount) {
      const recomputed = mergeFlags(flags, computeContentFlags({ ...input, assetCount }));
      if (recomputed.join() !== flags.join()) await tx.question.update({ where: { id: q.id }, data: { flags: recomputed } });
    }
    await tx.questionVersion.create({
      data: { questionId: q.id, version: 1, snapshot: snapshot({ ...input, status }), editedById: actor.id, changeNote: "created" },
    });
    return q;
  });
  return { question, nearDuplicates: dupes };
}

export async function updateQuestion(
  id: string,
  input: QuestionInput,
  actor: Actor,
  opts: { expectedVersion?: number; changeNote?: string; status?: QuestionStatus; confirmTaxonomy?: boolean } = {},
) {
  const current = await db.question.findUnique({ where: { id } });
  if (!current) throw new HttpError(404, "NOT_FOUND");
  if (opts.expectedVersion != null && opts.expectedVersion !== current.version) {
    throw new HttpError(409, "VERSION_CONFLICT", "Someone else saved this question. Reload to see their changes.");
  }

  const { contentFlags: _ignored, ...data } = contentData(input, 0);
  const dupes = await nearDuplicatesOf(data.fingerprint, input.section, [id]);
  const status = opts.status ?? current.status;

  return db.$transaction(async (tx) => {
    await assertCodeFree(tx, input.code, id);
    const assetCount = await attachAssets(tx, id, input);
    const linkedAssets = await tx.questionAsset.count({ where: { questionId: id } });
    const previous = opts.confirmTaxonomy ? current.flags.filter((f) => f !== "TAXONOMY_UNCONFIRMED") : current.flags;
    let flags = mergeFlags(previous, computeContentFlags({ ...input, assetCount: Math.max(assetCount, linkedAssets) }));
    if (dupes.length && !current.flags.includes("NEAR_DUPLICATE") && current.fingerprint !== data.fingerprint) {
      flags = [...new Set([...flags, "NEAR_DUPLICATE"])].sort();
    }
    if (status === "PUBLISHED" && blockingFlags(flags).length) throw new HttpError(422, "BLOCKING_FLAGS");
    const version = current.version + 1;
    const q = await tx.question.update({
      where: { id, version: current.version },
      data: { ...data, flags, status, version },
    });
    await tx.questionVersion.create({
      data: { questionId: id, version, snapshot: snapshot({ ...input, status }), editedById: actor.id, changeNote: opts.changeNote ?? null },
    });
    return { question: q, nearDuplicates: dupes };
  });
}

/** Move a question through draft → in_review → published (or retired). */
export async function setQuestionStatus(id: string, status: QuestionStatus, actor: Actor) {
  const q = await db.question.findUnique({ where: { id } });
  if (!q) throw new HttpError(404, "NOT_FOUND");
  if (status === q.status) return q;
  const now = new Date();
  if (status === "PUBLISHED") {
    const blocking = blockingFlags(q.flags);
    if (blocking.length) throw new HttpError(422, "BLOCKING_FLAGS", blocking.join(", "));
    if (q.sourceId) {
      const source = await db.source.findUnique({ where: { id: q.sourceId }, select: { withdrawnAt: true } });
      if (source?.withdrawnAt) throw new HttpError(422, "SOURCE_WITHDRAWN");
    }
  }
  return db.$transaction(async (tx) => {
    const updated = await tx.question.update({
      where: { id },
      data: {
        status,
        ...(status === "PUBLISHED"
          ? {
              publishedAt: q.publishedAt ?? now,
              reviewedById: actor.id,
              reviewedAt: now,
              flags: q.flags.filter((f) => !(PROCESS_FLAGS_CLEARED_ON_APPROVAL as readonly string[]).includes(f)),
              reportCount: 0,
            }
          : {}),
      },
    });
    if (status === "PUBLISHED") {
      await tx.questionReport.updateMany({
        where: { questionId: id, status: "OPEN" },
        data: { status: "RESOLVED", resolvedById: actor.id, resolvedAt: now, resolution: "Re-approved after review" },
      });
    }
    await audit(actor.id, `question.status.${status.toLowerCase()}`, "Question", id, { from: q.status, to: status });
    return updated;
  });
}

export async function bulkSetStatus(ids: string[], status: QuestionStatus, actor: Actor) {
  const results = { updated: [] as string[], skipped: [] as { id: string; reason: string }[] };
  for (const id of ids) {
    try {
      await setQuestionStatus(id, status, actor);
      results.updated.push(id);
    } catch (e) {
      results.skipped.push({ id, reason: e instanceof HttpError ? e.code : "ERROR" });
    }
  }
  return results;
}

/** Bulk edit difficulty / domain / skill (keeps versions). */
export async function bulkUpdateMeta(
  ids: string[],
  patch: { difficulty?: "EASY" | "MEDIUM" | "HARD"; domain?: string; skill?: string },
  actor: Actor,
) {
  const questions = await db.question.findMany({ where: { id: { in: ids } } });
  for (const q of questions) {
    const domain = patch.domain ?? q.domain;
    const skill = patch.skill ?? q.skill;
    const dom = getDomain(domain);
    if (!dom || dom.section !== q.section || !(dom.skills as readonly string[]).includes(skill)) continue;
    await db.$transaction(async (tx) => {
      const version = q.version + 1;
      const updated = await tx.question.update({
        where: { id: q.id },
        data: {
          difficulty: patch.difficulty ?? q.difficulty,
          domain,
          skill,
          version,
          flags: patch.domain || patch.skill ? q.flags.filter((f) => f !== "TAXONOMY_UNCONFIRMED") : q.flags,
        },
      });
      await tx.questionVersion.create({
        data: {
          questionId: q.id,
          version,
          snapshot: questionToSnapshot(updated),
          editedById: actor.id,
          changeNote: "bulk edit",
        },
      });
    });
  }
}

export function questionToSnapshot(q: {
  code: string;
  section: string;
  domain: string;
  skill: string;
  difficulty: string;
  type: string;
  passage: string | null;
  stem: string;
  choices: unknown;
  correctAnswers: string[];
  explanation: string | null;
  wrongChoiceRationales: unknown;
  tags: string[];
  sourceId: string | null;
  status: string;
}): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify({
      code: q.code,
      section: q.section,
      domain: q.domain,
      skill: q.skill,
      difficulty: q.difficulty,
      type: q.type,
      passage: q.passage,
      stem: q.stem,
      choices: q.choices,
      correctAnswers: q.correctAnswers,
      explanation: q.explanation,
      wrongChoiceRationales: q.wrongChoiceRationales,
      tags: q.tags,
      sourceId: q.sourceId,
      status: q.status,
    }),
  );
}

/** Confirm the suggested domain and skill as they are (bulk review action). */
export async function confirmTaxonomy(ids: string[], actor: Actor) {
  const questions = await db.question.findMany({ where: { id: { in: ids }, flags: { has: "TAXONOMY_UNCONFIRMED" } }, select: { id: true, flags: true } });
  for (const q of questions) {
    await db.question.update({ where: { id: q.id }, data: { flags: q.flags.filter((f) => f !== "TAXONOMY_UNCONFIRMED") } });
  }
  await audit(actor.id, "question.taxonomy.confirm", "Question", null, { count: questions.length });
  return questions.length;
}

/** Next free codes for a prefix + domain, following the configured format. */
export async function suggestNextCodes(prefix: string, domain: string, count = 1, reserved: ReadonlySet<string> = new Set()) {
  const dom = getDomain(domain);
  if (!dom) throw new HttpError(400, "INVALID_DOMAIN");
  const t = codeTemplate(siteConfig.questionCodes.format, prefix, dom.code);
  const existing = await db.question.findMany({ where: { code: { startsWith: t.head } }, select: { code: true } });
  return suggestCodes(
    existing.map((e) => e.code),
    t,
    siteConfig.questionCodes.padding,
    count,
    reserved,
  );
}

/** Permission withdrawn: unpublish everything from a source (or one of its files). */
export async function withdrawSource(sourceId: string, actor: Actor, opts: { fileId?: string } = {}) {
  const where: Prisma.QuestionWhereInput = opts.fileId
    ? { sourceId, sourceFileId: opts.fileId, status: { in: ["PUBLISHED", "IN_REVIEW", "DRAFT"] } }
    : { sourceId, status: { in: ["PUBLISHED", "IN_REVIEW", "DRAFT"] } };
  const result = await db.$transaction(async (tx) => {
    const res = await tx.question.updateMany({ where, data: { status: "RETIRED" } });
    if (!opts.fileId) await tx.source.update({ where: { id: sourceId }, data: { withdrawnAt: new Date() } });
    return res;
  });
  await audit(actor.id, opts.fileId ? "source.file.withdraw" : "source.withdraw", "Source", sourceId, {
    fileId: opts.fileId ?? null,
    retired: result.count,
  });
  return result.count;
}

/** A student reports a problem. Enough open reports send the question back to review. */
export async function reportQuestion(
  questionId: string,
  userId: string,
  reason: "WRONG_ANSWER" | "TYPO" | "UNCLEAR" | "FIGURE" | "OTHER",
  message: string | null,
) {
  const q = await db.question.findUnique({ where: { id: questionId }, select: { id: true, status: true, flags: true } });
  if (!q) throw new HttpError(404, "NOT_FOUND");
  const existing = await db.questionReport.findUnique({ where: { questionId_userId: { questionId, userId } } });
  if (existing && existing.status === "OPEN") return { alreadyReported: true };

  await db.$transaction(async (tx) => {
    if (existing) {
      await tx.questionReport.update({
        where: { id: existing.id },
        data: { reason, message, status: "OPEN", resolvedAt: null, resolvedById: null, resolution: null, createdAt: new Date() },
      });
    } else {
      await tx.questionReport.create({ data: { questionId, userId, reason, message } });
    }
    const open = await tx.questionReport.count({ where: { questionId, status: "OPEN" } });
    const sendBack = q.status === "PUBLISHED" && open >= siteConfig.review.reportsToUnpublish;
    await tx.question.update({
      where: { id: questionId },
      data: {
        reportCount: open,
        flags: [...new Set([...q.flags, "STUDENT_REPORT"])].sort(),
        ...(sendBack ? { status: "IN_REVIEW" } : {}),
      },
    });
  });
  return { alreadyReported: false };
}
