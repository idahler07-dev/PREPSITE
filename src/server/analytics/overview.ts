import "server-only";
import siteConfig from "@site";
import { db } from "@/lib/db";

const DAY = 86_400_000;

/** Site-wide numbers for Admin → Analytics. Days are in the site time zone. */
export async function analyticsOverview(now = new Date()) {
  const tz = siteConfig.defaultTimeZone;
  const since30 = new Date(now.getTime() - 30 * DAY);
  const active = (days: number) =>
    db.attempt.findMany({ where: { startedAt: { gte: new Date(now.getTime() - days * DAY) } }, distinct: ["userId"], select: { userId: true } }).then((r) => r.length);

  const [students, newThisWeek, dau, wau, mau, premium, perDay, signupsPerWeek, mocks, skillRows] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: new Date(now.getTime() - 7 * DAY) } } }),
    active(1),
    active(7),
    active(30),
    db.subscription.findMany({ where: { canceledAt: null, endsAt: { gt: now } }, distinct: ["userId"], select: { userId: true } }).then((r) => r.length),
    db.$queryRaw<{ day: string; answered: bigint; correct: bigint }[]>`
      SELECT to_char(date_trunc('day', r."gradedAt" AT TIME ZONE 'UTC' AT TIME ZONE ${tz}), 'YYYY-MM-DD') AS day,
             count(*) AS answered, count(*) FILTER (WHERE r."isCorrect") AS correct
      FROM "Response" r WHERE r."gradedAt" >= ${since30} AND r.answer IS NOT NULL
      GROUP BY 1 ORDER BY 1`,
    db.$queryRaw<{ week: string; n: bigint }[]>`
      SELECT to_char(date_trunc('week', u."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${tz}), 'YYYY-MM-DD') AS week, count(*) AS n
      FROM "User" u WHERE u."createdAt" >= ${new Date(now.getTime() - 12 * 7 * DAY)}
      GROUP BY 1 ORDER BY 1`,
    db.attempt.findMany({ where: { kind: "MOCK", status: "COMPLETED", completedAt: { gte: since30 } }, select: { scores: true } }),
    db.$queryRaw<{ skill: string; answered: bigint; correct: bigint }[]>`
      SELECT q.skill, count(*) AS answered, count(*) FILTER (WHERE r."isCorrect") AS correct
      FROM "Response" r JOIN "Question" q ON q.id = r."questionId"
      WHERE r."gradedAt" >= ${since30} AND r.answer IS NOT NULL
      GROUP BY q.skill HAVING count(*) >= 20`,
  ]);
  const totals = mocks.map((m) => (m.scores as { total?: { score: number } } | null)?.total?.score).filter((x): x is number => typeof x === "number");
  return {
    students,
    newThisWeek,
    active: { day: dau, week: wau, month: mau },
    premium,
    perDay: perDay.map((d) => ({ day: d.day, answered: Number(d.answered), correct: Number(d.correct) })),
    signupsPerWeek: signupsPerWeek.map((w) => ({ week: w.week, n: Number(w.n) })),
    mocksCompleted: mocks.length,
    averageEstimate: totals.length ? Math.round(totals.reduce((s, n) => s + n, 0) / totals.length / 10) * 10 : null,
    skills: skillRows
      .map((s) => ({ skill: s.skill, answered: Number(s.answered), accuracy: Number(s.correct) / Number(s.answered) }))
      .sort((a, b) => a.accuracy - b.accuracy),
  };
}
