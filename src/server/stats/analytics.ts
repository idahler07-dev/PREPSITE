import "server-only";
import { db } from "@/lib/db";
import { addDays, dayInZone } from "@/lib/stats/streak";

const DAY_MS = 86_400_000;

/** Correct and incorrect answers per day for the last `days` days (the student's time zone), zeros filled in. */
export async function dailyResults(userId: string, timeZone: string, days = 30, now = new Date()) {
  const since = new Date(now.getTime() - (days + 1) * DAY_MS);
  const rows = await db.$queryRaw<{ day: string; correct: bigint; incorrect: bigint }[]>`
    SELECT to_char(r."gradedAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone}, 'YYYY-MM-DD') AS day,
           COUNT(*) FILTER (WHERE r."isCorrect") AS correct,
           COUNT(*) FILTER (WHERE NOT r."isCorrect") AS incorrect
    FROM "Response" r
    JOIN "AttemptModule" m ON m.id = r."moduleId"
    JOIN "Attempt" a ON a.id = m."attemptId"
    WHERE a."userId" = ${userId} AND r."gradedAt" >= ${since} AND r.answer IS NOT NULL
    GROUP BY 1`;
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const today = dayInZone(now, timeZone);
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(today, i - days + 1);
    const r = byDay.get(day);
    return { day, correct: Number(r?.correct ?? 0), incorrect: Number(r?.incorrect ?? 0) };
  });
}

/** Questions answered per day for the last `weeks` whole weeks (Monday first), for the streak heatmap. */
export async function activityDays(userId: string, timeZone: string, weeks = 18, now = new Date()) {
  const today = dayInZone(now, timeZone);
  const weekday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0
  const first = addDays(today, -(weeks - 1) * 7 - weekday);
  const since = new Date(new Date(`${first}T00:00:00Z`).getTime() - DAY_MS);
  const rows = await db.$queryRaw<{ day: string; n: bigint }[]>`
    SELECT to_char(r."answeredAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone}, 'YYYY-MM-DD') AS day, COUNT(*) AS n
    FROM "Response" r
    JOIN "AttemptModule" m ON m.id = r."moduleId"
    JOIN "Attempt" a ON a.id = m."attemptId"
    WHERE a."userId" = ${userId} AND r."answeredAt" >= ${since} AND r.answer IS NOT NULL
    GROUP BY 1`;
  const byDay = new Map(rows.map((r) => [r.day, Number(r.n)]));
  const total = weeks * 7;
  return Array.from({ length: total }, (_, i) => {
    const day = addDays(first, i);
    return { day, count: day > today ? null : (byDay.get(day) ?? 0) };
  });
}

/** Average seconds per answered question by section and difficulty. */
export async function timeByDifficulty(userId: string) {
  const rows = await db.$queryRaw<{ section: "RW" | "MATH"; difficulty: "EASY" | "MEDIUM" | "HARD"; avg_ms: number; n: bigint }[]>`
    SELECT q.section::text AS section, q.difficulty::text AS difficulty, AVG(r."timeSpentMs")::float AS avg_ms, COUNT(*) AS n
    FROM "Response" r
    JOIN "Question" q ON q.id = r."questionId"
    JOIN "AttemptModule" m ON m.id = r."moduleId"
    JOIN "Attempt" a ON a.id = m."attemptId"
    WHERE a."userId" = ${userId} AND r.answer IS NOT NULL AND r."timeSpentMs" > 0
    GROUP BY 1, 2`;
  return rows.map((r) => ({ section: r.section, difficulty: r.difficulty, seconds: Math.round(r.avg_ms / 1000), n: Number(r.n) }));
}
