import "server-only";
import siteConfig from "@site";
import { db } from "@/lib/db";
import { currentEnd, hasPremium, limitsFor, subscriptionState, type SubscriptionState } from "@/lib/billing/subscription";
import { startOfDayInZone } from "@/lib/stats/streak";
import { HttpError } from "@/server/http";
import { isOwner } from "@/server/auth/owner";

export interface Entitlement {
  state: SubscriptionState;
  premium: boolean;
  endsAt: Date | null;
  /** Plan of the subscription that ends last (for one-click renewal). */
  planId: string | null;
  owner: boolean;
}

/** What a user may use right now. Checked on the server for every limited action. */
export async function getEntitlement(userId: string, now = new Date()): Promise<Entitlement> {
  const [user, subs] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } }),
    db.subscription.findMany({ where: { userId, canceledAt: null }, orderBy: { endsAt: "desc" }, select: { endsAt: true, canceledAt: true, planId: true } }),
  ]);
  const endsAt = currentEnd(subs);
  const state = subscriptionState(endsAt, now);
  const owner = isOwner(user);
  return { state, premium: hasPremium(state) || owner, endsAt, planId: subs[0]?.planId ?? null, owner };
}

async function questionsStartedToday(userId: string): Promise<number> {
  return db.response.count({
    where: {
      module: {
        attempt: { userId, kind: { in: ["DRILL", "DAILY", "REVIEW"] }, startedAt: { gte: startOfDayInZone(new Date(), siteConfig.defaultTimeZone) } },
      },
    },
  });
}

/** Free plan: a daily number of practice questions. Throws 402 DAILY_LIMIT (message = how many are left). */
export async function assertQuestionAllowance(userId: string, count: number) {
  const ent = await getEntitlement(userId);
  const limit = ent.premium ? null : limitsFor(ent.state).questionsPerDay;
  if (limit === null) return;
  const left = Math.max(0, limit - (await questionsStartedToday(userId)));
  if (count > left) throw new HttpError(402, "DAILY_LIMIT", String(left));
}

/** Free plan: a fixed number of practice tests (full, section or module). */
export async function assertTestAllowance(userId: string) {
  const ent = await getEntitlement(userId);
  const limit = ent.premium ? null : limitsFor(ent.state).practiceTests;
  if (limit === null) return;
  const taken = await db.attempt.count({ where: { userId, kind: { in: ["MOCK", "SECTION", "MODULE"] } } });
  if (taken >= limit) throw new HttpError(402, "TEST_LIMIT");
}

/** Questions and tests a free student has left (for the dashboard and practice pages). */
export async function usageSummary(userId: string) {
  const ent = await getEntitlement(userId);
  if (ent.premium) return { ent, questionsLeft: null, testsLeft: null };
  const limits = limitsFor(ent.state);
  const [today, tests] = await Promise.all([questionsStartedToday(userId), db.attempt.count({ where: { userId, kind: { in: ["MOCK", "SECTION", "MODULE"] } } })]);
  return {
    ent,
    questionsLeft: limits.questionsPerDay === null ? null : Math.max(0, limits.questionsPerDay - today),
    testsLeft: limits.practiceTests === null ? null : Math.max(0, limits.practiceTests - tests),
  };
}
