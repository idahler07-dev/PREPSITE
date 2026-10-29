import "server-only";
import siteConfig from "@site";
import { db } from "@/lib/db";
import { billing } from "@/config/plans";
import { currentEnd } from "@/lib/billing/subscription";
import { dayInZone } from "@/lib/stats/streak";
import { audit } from "@/server/audit";
import { getProvider } from "@/server/payments";
import { expireStaleOrders, markCanceled, markPaid, markRefunded } from "@/server/payments/orders";
import { sendRenewalReminder } from "@/server/payments/notify";

const DAY = 86_400_000;

/** Renewal reminders N days before premium ends (once per end date and N). */
export async function sendRenewalReminders(now = new Date()) {
  const maxDays = Math.max(...billing.reminderDays);
  const soon = await db.subscription.findMany({
    where: { canceledAt: null, endsAt: { gt: now, lte: new Date(now.getTime() + maxDays * DAY) } },
    select: { userId: true },
    distinct: ["userId"],
  });
  let sent = 0;
  for (const { userId } of soon) {
    const subs = await db.subscription.findMany({ where: { userId, canceledAt: null }, select: { endsAt: true, canceledAt: true } });
    const end = currentEnd(subs);
    if (!end || end <= now) continue;
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / DAY);
    // The largest reminder the student is now within, e.g. 3 when 2.5 days are left.
    const due = billing.reminderDays.filter((d) => daysLeft <= d).sort((a, b) => a - b)[0];
    if (due === undefined) continue;
    const endsOn = dayInZone(end, siteConfig.defaultTimeZone);
    try {
      await db.billingReminder.create({ data: { userId, endsOn, daysBefore: due } });
    } catch {
      continue; // already sent for this end date
    }
    const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, email: true, telegramId: true, locale: true, notificationPrefs: true } });
    await sendRenewalReminder(user, daysLeft, end, `${endsOn}:${due}`).catch((e) => console.error("[billing] reminder", e));
    sent++;
  }
  return sent;
}

/**
 * Compare our orders with the providers that can report a status: pending
 * orders older than 30 minutes and orders paid in the last 3 days.
 */
export async function reconcile(now = new Date()) {
  const candidates = await db.order.findMany({
    where: {
      OR: [
        { status: "PENDING", createdAt: { lt: new Date(now.getTime() - 30 * 60_000) } },
        { status: "PAID", paidAt: { gte: new Date(now.getTime() - 3 * DAY) } },
      ],
    },
    take: 500,
  });
  const issues: { order: number; ours: string; theirs: string; fixed: boolean }[] = [];
  for (const o of candidates) {
    const provider = getProvider(o.provider);
    if (!provider?.fetchStatus || !provider.configured()) continue;
    let theirs: string;
    try {
      theirs = await provider.fetchStatus({ id: o.id, providerRef: o.providerRef });
    } catch (e) {
      console.warn(`[reconcile] ${o.provider} ${o.number}`, e);
      continue;
    }
    if (theirs === "unknown" || theirs === "pending") continue;
    const expected = o.status === "PAID" ? "paid" : "pending";
    if (theirs === expected) continue;
    let fixed = false;
    if (o.status === "PENDING" && theirs === "paid") fixed = await markPaid(o.id, {});
    else if (o.status === "PENDING" && (theirs === "canceled" || theirs === "failed")) {
      await markCanceled(o.id, `reconciled: ${theirs}`, theirs === "failed" ? "FAILED" : "CANCELED");
      fixed = true;
    } else if (o.status === "PAID" && theirs === "refunded") fixed = await markRefunded(o.id);
    issues.push({ order: o.number, ours: o.status, theirs, fixed });
  }
  if (issues.length) await audit(null, "billing.reconcile", "Order", null, { issues });
  return issues;
}

export async function runBillingDaily(now = new Date()) {
  const expired = await expireStaleOrders(now);
  const reminders = await sendRenewalReminders(now);
  const issues = await reconcile(now);
  await audit(null, "jobs.billing-daily", "Job", dayInZone(now, siteConfig.defaultTimeZone), { expired, reminders, issues: issues.length });
  return { expired, reminders, issues };
}

/** For cron-only hosting: run the daily job once per day from the every-minute cron. */
export async function billingDailyDue(now = new Date()): Promise<boolean> {
  const today = dayInZone(now, siteConfig.defaultTimeZone);
  const done = await db.auditLog.count({ where: { action: "jobs.billing-daily", entityId: today } });
  return done === 0;
}

/** Cron-only hosting: evening reminders once a day, after 18:45 site time. */
export async function eveningRemindersDue(now = new Date()): Promise<boolean> {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: siteConfig.defaultTimeZone, hour: "2-digit", hourCycle: "h23" }).format(now));
  const minute = now.getUTCMinutes();
  if (hour < 18 || (hour === 18 && minute < 45)) return false;
  const today = dayInZone(now, siteConfig.defaultTimeZone);
  return (await db.auditLog.count({ where: { action: "jobs.evening-reminders", entityId: today } })) === 0;
}
