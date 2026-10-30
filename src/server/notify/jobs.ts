import "server-only";
import siteConfig from "@site";
import { db } from "@/lib/db";
import { computeStreak, dayInZone, startOfDayInZone } from "@/lib/stats/streak";
import { audit } from "@/server/audit";
import { notify } from "./index";

const DAY = 86_400_000;
const recipientSelect = { id: true, email: true, telegramId: true, locale: true, notificationPrefs: true } as const;

/**
 * Evening: students who practised in the last two weeks but not today get a
 * reminder — "keep your streak" if they have one, otherwise a gentle nudge.
 */
export async function sendEveningReminders(now = new Date()) {
  const tz = siteConfig.defaultTimeZone;
  const today = dayInZone(now, tz);
  const startToday = startOfDayInZone(now, tz);
  const active = await db.attempt.findMany({
    where: { startedAt: { gte: new Date(now.getTime() - 14 * DAY) } },
    select: { userId: true, startedAt: true },
  });
  const byUser = new Map<string, Date[]>();
  for (const a of active) byUser.set(a.userId, [...(byUser.get(a.userId) ?? []), a.startedAt]);
  let sent = 0;
  for (const [userId, dates] of byUser) {
    if (dates.some((d) => d >= startToday)) continue; // already practised today
    const streak = computeStreak(dates.map((d) => dayInZone(d, tz)), today);
    const user = await db.user.findUnique({ where: { id: userId }, select: recipientSelect });
    if (!user) continue;
    const ok =
      streak >= 2
        ? await notify(user, "streak", today, (t) => ({ subject: t("streak.subject", { count: streak }), body: t("streak.body", { count: streak }), path: "/practice", cta: t("streak.cta") }))
        : await notify(user, "study", today, (t) => ({ subject: t("study.subject"), body: t("study.body"), path: "/plan", cta: t("study.cta") }));
    if (ok) sent++;
  }
  await audit(null, "jobs.evening-reminders", "Job", today, { sent });
  return sent;
}

/** A new practice test was published: tell students active in the last 30 days. */
export async function announceNewTest(mockTestId: string, now = new Date()) {
  const mock = await db.mockTest.findUnique({ where: { id: mockTestId }, select: { title: true, status: true, kind: true } });
  if (!mock || mock.status !== "PUBLISHED" || mock.kind !== "CURATED") return 0;
  const users = await db.user.findMany({
    where: { attempts: { some: { startedAt: { gte: new Date(now.getTime() - 30 * DAY) } } } },
    select: recipientSelect,
    take: 5000,
  });
  let sent = 0;
  for (const u of users) {
    if (await notify(u, "newTests", mockTestId, (t) => ({ subject: t("newTest.subject", { title: mock.title }), body: t("newTest.body", { title: mock.title }), path: "/mocks", cta: t("newTest.cta") }))) sent++;
  }
  return sent;
}
