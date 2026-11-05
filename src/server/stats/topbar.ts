import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { computeStreak, dayInZone } from "@/lib/stats/streak";
import { XP_PER_CORRECT } from "@/lib/path";
import type { ScoreEstimate } from "@/lib/mock/scoring";

export interface TopBarStats {
  streak: number;
  xp: number;
  /** Latest practice-test estimate, else the latest official score the student logged. */
  score: number | null;
}

/**
 * Numbers for the app's top bar: streak, XP (10 per correct answer) and
 * estimated score. Cached per request so pages that also need them don't
 * query twice.
 */
export const topBarStats = cache(async (userId: string, timeZone: string): Promise<TopBarStats> => {
  const [days, correct, mock, official] = await Promise.all([
    db.$queryRaw<{ day: string }[]>`
      SELECT DISTINCT to_char((r."answeredAt" AT TIME ZONE 'UTC') AT TIME ZONE ${timeZone}, 'YYYY-MM-DD') AS day
      FROM "Response" r
      JOIN "AttemptModule" m ON m."id" = r."moduleId"
      JOIN "Attempt" a ON a."id" = m."attemptId"
      WHERE a."userId" = ${userId} AND r."answeredAt" IS NOT NULL AND r."answeredAt" > now() - interval '400 days'`,
    db.$queryRaw<{ n: bigint }[]>`
      SELECT count(*) AS n
      FROM "Response" r
      JOIN "AttemptModule" m ON m."id" = r."moduleId"
      JOIN "Attempt" a ON a."id" = m."attemptId"
      WHERE a."userId" = ${userId} AND r."isCorrect"`,
    db.attempt.findFirst({ where: { userId, kind: "MOCK", status: "COMPLETED" }, orderBy: { completedAt: "desc" }, select: { scores: true } }),
    db.officialScore.findFirst({ where: { userId }, orderBy: [{ takenOn: "desc" }, { createdAt: "desc" }], select: { total: true } }),
  ]);
  const estimate = (mock?.scores as ScoreEstimate | null)?.total?.score ?? null;
  return {
    streak: computeStreak(
      days.map((d) => d.day),
      dayInZone(new Date(), timeZone),
    ),
    xp: Number(correct[0]?.n ?? 0) * XP_PER_CORRECT,
    score: estimate ?? official?.total ?? null,
  };
});
