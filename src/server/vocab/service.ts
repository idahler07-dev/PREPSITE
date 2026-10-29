import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { CARD_GRADES, NEW_CARD, review } from "@/lib/srs/sm2";
import { HttpError } from "@/server/http";

/** New words introduced per session (on top of words that are due). */
export const NEW_WORDS_PER_SESSION = 10;

export async function vocabSession(userId: string, now = new Date(), limit = 20) {
  const due = await db.vocabProgress.findMany({
    where: { userId, dueAt: { lte: now }, word: { published: true } },
    orderBy: { dueAt: "asc" },
    take: limit,
    include: { word: true },
  });
  const fresh =
    due.length < limit
      ? await db.vocabWord.findMany({
          where: { published: true, progress: { none: { userId } } },
          orderBy: { createdAt: "asc" },
          take: Math.min(NEW_WORDS_PER_SESSION, limit - due.length),
        })
      : [];
  return [...due.map((p) => ({ ...p.word, isNew: false })), ...fresh.map((w) => ({ ...w, isNew: true }))];
}

export async function vocabCounts(userId: string, now = new Date()) {
  const [due, learning, total] = await Promise.all([
    db.vocabProgress.count({ where: { userId, dueAt: { lte: now }, word: { published: true } } }),
    db.vocabProgress.count({ where: { userId, word: { published: true } } }),
    db.vocabWord.count({ where: { published: true } }),
  ]);
  return { due, learning, unseen: Math.max(0, total - learning) };
}

export const gradeSchema = z.object({ wordId: z.string().max(40), grade: z.enum(["again", "hard", "good", "easy"]) });

export async function gradeWord(userId: string, raw: unknown, now = new Date()) {
  const { wordId, grade } = gradeSchema.parse(raw);
  const word = await db.vocabWord.findUnique({ where: { id: wordId }, select: { published: true } });
  if (!word?.published) throw new HttpError(404, "NOT_FOUND");
  const current = await db.vocabProgress.findUnique({ where: { userId_wordId: { userId, wordId } } });
  const next = review(current ?? NEW_CARD, CARD_GRADES[grade], now);
  await db.vocabProgress.upsert({
    where: { userId_wordId: { userId, wordId } },
    create: { userId, wordId, ...next, lastReviewedAt: now },
    update: { ...next, lastReviewedAt: now },
  });
  return { intervalDays: next.intervalDays };
}

export const wordSchema = z.object({
  word: z.string().trim().min(1).max(60),
  partOfSpeech: z.string().trim().min(1).max(30),
  definition: z.string().trim().min(1).max(400),
  example: z.string().trim().min(1).max(600),
  uz: z.string().trim().max(200).optional().default(""),
  ru: z.string().trim().max(200).optional().default(""),
  published: z.boolean().default(true),
});
