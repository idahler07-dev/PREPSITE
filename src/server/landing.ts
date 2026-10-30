import "server-only";
import siteConfig from "@site";
import { db } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown/render";

export interface FeaturedQuestion {
  id: string;
  stemHtml: string;
  choices: { key: string; html: string }[];
}

/**
 * The landing page's live question: a published multiple-choice question
 * without a passage (short enough for a card), rotating once a day.
 * Teacher-written questions are preferred over sample ones.
 */
async function featuredRow() {
  const where = { status: "PUBLISHED" as const, type: "MCQ" as const, passage: null };
  const real = await db.question.count({ where: { ...where, isSample: false } });
  const filter = real > 0 ? { ...where, isSample: false } : where;
  const total = real > 0 ? real : await db.question.count({ where: filter });
  if (!total) return null;
  const day = Math.floor(Date.now() / 86_400_000);
  const [row] = await db.question.findMany({
    where: filter,
    orderBy: { id: "asc" },
    skip: day % total,
    take: 1,
    select: { id: true, stem: true, choices: true, correctAnswers: true, explanation: true },
  });
  return row ?? null;
}

export async function getFeaturedQuestion(): Promise<FeaturedQuestion | null> {
  const row = await featuredRow();
  const choices = Array.isArray(row?.choices) ? (row.choices as { key: string; text: string }[]) : [];
  if (!row || choices.length !== 4 || row.stem.length > 400) return null;
  return { id: row.id, stemHtml: renderMarkdown(row.stem), choices: choices.map((c) => ({ key: c.key, html: renderMarkdown(c.text) })) };
}

/** Check an answer to today's featured question only (so this can't be used to collect answer keys). */
export async function checkFeatured(questionId: string, key: string) {
  const row = await featuredRow();
  if (!row || row.id !== questionId) return null;
  const correctKey = row.correctAnswers[0] ?? "";
  return { correct: key === correctKey, correctKey, explanationHtml: row.explanation ? renderMarkdown(row.explanation) : null };
}

/** Real figures for the landing page; each is null until it passes its threshold in site.config. */
export async function getPublicStats() {
  const t = siteConfig.publicStats;
  const [questions, students, answers] = await Promise.all([
    db.question.count({ where: { status: "PUBLISHED", isSample: false } }),
    db.user.count({ where: { role: "STUDENT", onboardedAt: { not: null } } }),
    db.response.count({ where: { answeredAt: { not: null } } }),
  ]);
  return {
    questions: questions >= t.minQuestions ? questions : null,
    students: students >= t.minStudents ? students : null,
    answers: answers >= t.minAnswers ? answers : null,
  };
}
