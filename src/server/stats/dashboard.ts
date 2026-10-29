import "server-only";
import { db } from "@/lib/db";
import { computeStreak, dayInZone } from "@/lib/stats/streak";

export interface AccuracyRow {
  key: string;
  section: "RW" | "MATH";
  total: number;
  correct: number;
}

/** Real numbers from the student's own practice only. */
export async function getDashboardStats(userId: string, timeZone: string) {
  const [totals, byDomain, bySkill, days, recent, open] = await Promise.all([
    db.$queryRaw<{ graded: bigint; answered: bigint; correct: bigint; avg_ms: number | null }[]>`
      SELECT count(*) AS graded,
             count(*) FILTER (WHERE r."answer" IS NOT NULL) AS answered,
             count(*) FILTER (WHERE r."isCorrect") AS correct,
             avg(r."timeSpentMs") FILTER (WHERE r."answer" IS NOT NULL AND r."timeSpentMs" > 0)::float AS avg_ms
      FROM "Response" r
      JOIN "AttemptModule" m ON m."id" = r."moduleId"
      JOIN "Attempt" a ON a."id" = m."attemptId"
      WHERE a."userId" = ${userId} AND r."gradedAt" IS NOT NULL`,
    db.$queryRaw<{ key: string; section: "RW" | "MATH"; total: bigint; correct: bigint }[]>`
      SELECT q."domain" AS key, q."section" AS section, count(*) AS total, count(*) FILTER (WHERE r."isCorrect") AS correct
      FROM "Response" r
      JOIN "Question" q ON q."id" = r."questionId"
      JOIN "AttemptModule" m ON m."id" = r."moduleId"
      JOIN "Attempt" a ON a."id" = m."attemptId"
      WHERE a."userId" = ${userId} AND r."gradedAt" IS NOT NULL
      GROUP BY q."domain", q."section"`,
    db.$queryRaw<{ key: string; section: "RW" | "MATH"; total: bigint; correct: bigint }[]>`
      SELECT q."skill" AS key, q."section" AS section, count(*) AS total, count(*) FILTER (WHERE r."isCorrect") AS correct
      FROM "Response" r
      JOIN "Question" q ON q."id" = r."questionId"
      JOIN "AttemptModule" m ON m."id" = r."moduleId"
      JOIN "Attempt" a ON a."id" = m."attemptId"
      WHERE a."userId" = ${userId} AND r."gradedAt" IS NOT NULL
      GROUP BY q."skill", q."section"`,
    db.$queryRaw<{ day: string }[]>`
      SELECT DISTINCT to_char((r."answeredAt" AT TIME ZONE 'UTC') AT TIME ZONE ${timeZone}, 'YYYY-MM-DD') AS day
      FROM "Response" r
      JOIN "AttemptModule" m ON m."id" = r."moduleId"
      JOIN "Attempt" a ON a."id" = m."attemptId"
      WHERE a."userId" = ${userId} AND r."answeredAt" IS NOT NULL AND r."answeredAt" > now() - interval '400 days'`,
    db.attempt.findMany({
      where: { userId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 5,
      select: { id: true, kind: true, completedAt: true, correctCount: true, totalCount: true },
    }),
    db.attempt.findFirst({ where: { userId, status: "IN_PROGRESS" }, orderBy: { startedAt: "desc" }, select: { id: true } }),
  ]);
  const t = totals[0];
  const num = (b: bigint | number | null | undefined) => Number(b ?? 0);
  const toRows = (rows: { key: string; section: "RW" | "MATH"; total: bigint; correct: bigint }[]): AccuracyRow[] =>
    rows.map((r) => ({ key: r.key, section: r.section, total: num(r.total), correct: num(r.correct) }));
  const skills = toRows(bySkill);
  return {
    answered: num(t?.answered),
    graded: num(t?.graded),
    correct: num(t?.correct),
    avgMs: t?.avg_ms ?? null,
    streak: computeStreak(
      days.map((d) => d.day),
      dayInZone(new Date(), timeZone),
    ),
    byDomain: toRows(byDomain),
    weakSkills: skills
      .filter((s) => s.total >= 3)
      .sort((a, b) => a.correct / a.total - b.correct / b.total)
      .slice(0, 5),
    recent,
    openAttemptId: open?.id ?? null,
  };
}
