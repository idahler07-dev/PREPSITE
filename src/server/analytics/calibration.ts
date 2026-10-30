import "server-only";
import { db } from "@/lib/db";
import { calibrate, MIN_ANSWERS, type Calibration } from "@/lib/analytics/calibration";

/** Answer counts per question (graded, non-blank answers). */
async function answerCounts(questionIds: string[]) {
  const rows = await db.response.groupBy({
    by: ["questionId", "answer"],
    where: { questionId: { in: questionIds }, gradedAt: { not: null }, answer: { not: null } },
    _count: true,
  });
  const map = new Map<string, Record<string, number>>();
  for (const r of rows) {
    const m = map.get(r.questionId) ?? {};
    m[r.answer!] = (m[r.answer!] ?? 0) + r._count;
    map.set(r.questionId, m);
  }
  return map;
}

export async function calibrationReport() {
  const questions = await db.question.findMany({
    where: { status: "PUBLISHED", attemptCount: { gte: MIN_ANSWERS } },
    select: { id: true, code: true, difficulty: true, type: true, correctAnswers: true, flags: true, skill: true },
  });
  const counts = await answerCounts(questions.map((q) => q.id));
  return questions.map((q) => ({ ...q, calibration: calibrate({ ...q, answers: counts.get(q.id) ?? {} }) }));
}

/**
 * Nightly: store the measured difficulty (1 − accuracy) and flag questions
 * whose label doesn't match, or where a wrong choice beats the key.
 */
export async function runCalibration() {
  let flagged = 0;
  for (const q of await calibrationReport()) {
    const c = q.calibration as Calibration;
    if (c.status === "insufficient") continue;
    const mismatch = c.status !== "ok";
    const pattern = !!c.suspectChoice;
    let flags = q.flags.filter((f) => f !== "DIFFICULTY_MISMATCH" && f !== "ANSWER_PATTERN");
    if (mismatch) flags.push("DIFFICULTY_MISMATCH");
    if (pattern) flags.push("ANSWER_PATTERN");
    flags = [...new Set(flags)].sort();
    if (mismatch || pattern) flagged++;
    await db.question.update({ where: { id: q.id }, data: { difficultyRating: Math.round((1 - c.accuracy) * 1000) / 1000, flags } });
  }
  return flagged;
}
