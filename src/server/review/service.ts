import "server-only";
import { z } from "zod";
import siteConfig from "@site";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { LEARNED_AFTER_DAYS, NEW_CARD, qualityForAnswer, review } from "@/lib/srs/sm2";
import { dayInZone } from "@/lib/stats/streak";
import { seededRandom } from "@/lib/practice/drill";
import { HttpError } from "@/server/http";
import { assertQuestionAllowance } from "@/server/billing/entitlement";

const DAY = 86_400_000;

export interface Outcome {
  questionId: string;
  isCorrect: boolean;
  flagged: boolean;
  answered: boolean;
}

/**
 * After grading: in review sessions, reschedule each item (SM-2); elsewhere,
 * wrong and flagged questions go into the mistake notebook for tomorrow.
 */
export async function recordOutcomes(userId: string, kind: string, outcomes: Outcome[], now = new Date()) {
  for (const o of outcomes) {
    const existing = await db.reviewItem.findUnique({ where: { userId_questionId: { userId, questionId: o.questionId } } });
    if (kind === "REVIEW") {
      if (!existing) continue;
      const next = review(existing, qualityForAnswer(o.isCorrect), now);
      await db.reviewItem.update({
        where: { id: existing.id },
        data: { ...next, lastReviewedAt: now, archivedAt: o.isCorrect && next.intervalDays > LEARNED_AFTER_DAYS ? now : null },
      });
      continue;
    }
    // Wrong answers, and questions left blank in a test, are mistakes; marked-for-review ones are worth another look.
    const isTest = kind === "MOCK" || kind === "SECTION" || kind === "MODULE";
    const mistake = o.answered ? !o.isCorrect : isTest;
    if (!mistake && !o.flagged) continue;
    const reason = mistake ? "WRONG" : "FLAGGED";
    if (existing && !existing.archivedAt) continue; // already in the notebook
    await db.reviewItem.upsert({
      where: { userId_questionId: { userId, questionId: o.questionId } },
      create: { userId, questionId: o.questionId, reason, ...NEW_CARD, dueAt: new Date(now.getTime() + DAY) },
      update: { reason, ...NEW_CARD, dueAt: new Date(now.getTime() + DAY), archivedAt: null },
    });
  }
}

export async function notebookCounts(userId: string, now = new Date()) {
  const [due, total, bookmarks] = await Promise.all([
    db.reviewItem.count({ where: { userId, archivedAt: null, dueAt: { lte: now }, question: { status: "PUBLISHED" } } }),
    db.reviewItem.count({ where: { userId, archivedAt: null, question: { status: "PUBLISHED" } } }),
    db.questionNote.count({ where: { userId, bookmarked: true } }),
  ]);
  return { due, total, bookmarks };
}

async function createFixedAttempt(userId: string, kind: "REVIEW" | "DAILY" | "DRILL", questionIds: string[], config: Record<string, unknown>) {
  await assertQuestionAllowance(userId, questionIds.length);
  return db.attempt.create({
    data: {
      userId,
      kind,
      config: config as Prisma.InputJsonValue,
      feedbackMode: "IMMEDIATE",
      modules: { create: { index: 0, startedAt: new Date(), responses: { create: questionIds.map((questionId, position) => ({ questionId, position })) } } },
    },
    select: { id: true },
  });
}

/** A review session from the questions that are due (oldest first). */
export async function startReview(userId: string, raw: unknown) {
  const { count, source } = z.object({ count: z.coerce.number().int().min(1).max(30).default(10), source: z.enum(["due", "bookmarks"]).default("due") }).parse(raw ?? {});
  let ids: string[];
  if (source === "bookmarks") {
    const notes = await db.questionNote.findMany({ where: { userId, bookmarked: true, question: { status: "PUBLISHED" } }, orderBy: { updatedAt: "desc" }, take: count, select: { questionId: true } });
    ids = notes.map((n) => n.questionId);
    if (!ids.length) throw new HttpError(422, "NOTHING_DUE");
    return createFixedAttempt(userId, "DRILL", ids, { source: "bookmarks", count: ids.length });
  }
  const items = await db.reviewItem.findMany({
    where: { userId, archivedAt: null, dueAt: { lte: new Date() }, question: { status: "PUBLISHED" } },
    orderBy: { dueAt: "asc" },
    take: count,
    select: { questionId: true },
  });
  ids = items.map((i) => i.questionId);
  if (!ids.length) throw new HttpError(422, "NOTHING_DUE");
  return createFixedAttempt(userId, "REVIEW", ids, { source: "review", count: ids.length });
}

/**
 * One question a day, the same all day for this student: a published
 * question they haven't seen, chosen with a seed of their id and the date.
 */
export async function startDailyQuestion(userId: string, now = new Date()) {
  const day = dayInZone(now, siteConfig.defaultTimeZone);
  const existing = await db.attempt.findFirst({ where: { userId, kind: "DAILY", config: { path: ["day"], equals: day } }, select: { id: true } });
  if (existing) return existing;
  const seen = new Set((await db.response.findMany({ where: { module: { attempt: { userId } } }, select: { questionId: true }, distinct: ["questionId"] })).map((r) => r.questionId));
  const pool = (await db.question.findMany({ where: { status: "PUBLISHED" }, select: { id: true }, orderBy: { id: "asc" } })).map((q) => q.id);
  if (!pool.length) throw new HttpError(422, "NO_QUESTIONS");
  const unseen = pool.filter((id) => !seen.has(id));
  const from = unseen.length ? unseen : pool;
  let seed = 0;
  for (const ch of `${userId}:${day}`) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const pick = from[Math.floor(seededRandom(seed)() * from.length)]!;
  return createFixedAttempt(userId, "DAILY", [pick], { day });
}

export const noteSchema = z.object({
  questionId: z.string().max(40),
  bookmarked: z.boolean().optional(),
  note: z.string().max(2000).nullable().optional(),
});

/** Bookmark or annotate a question the student has been given before. */
export async function saveQuestionNote(userId: string, raw: unknown) {
  const input = noteSchema.parse(raw);
  const seen = await db.response.findFirst({ where: { questionId: input.questionId, module: { attempt: { userId } } }, select: { id: true } });
  if (!seen) throw new HttpError(404, "NOT_FOUND");
  const data = {
    ...(input.bookmarked !== undefined ? { bookmarked: input.bookmarked } : {}),
    ...(input.note !== undefined ? { note: input.note?.trim() || null } : {}),
  };
  return db.questionNote.upsert({
    where: { userId_questionId: { userId, questionId: input.questionId } },
    create: { userId, questionId: input.questionId, bookmarked: false, ...data },
    update: data,
  });
}

export async function removeFromNotebook(userId: string, questionId: string) {
  await db.reviewItem.updateMany({ where: { userId, questionId }, data: { archivedAt: new Date() } });
}
