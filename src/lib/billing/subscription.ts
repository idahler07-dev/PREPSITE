import { billing, freeLimits, premiumLimits, toMinor, type Currency, type PaidPlan, type PlanLimits } from "@/config/plans";

const DAY = 86_400_000;

export type SubscriptionState = "none" | "active" | "expiring" | "grace" | "expired";

/**
 * active → expiring soon (last days) → grace (a few days after the end,
 * premium still works) → expired.
 */
export function subscriptionState(endsAt: Date | null, now = new Date(), cfg = billing): SubscriptionState {
  if (!endsAt) return "none";
  const t = now.getTime();
  const end = endsAt.getTime();
  if (t < end - cfg.expiringSoonDays * DAY) return "active";
  if (t < end) return "expiring";
  if (t < end + cfg.graceDays * DAY) return "grace";
  return "expired";
}

export function hasPremium(state: SubscriptionState): boolean {
  return state === "active" || state === "expiring" || state === "grace";
}

export function limitsFor(state: SubscriptionState): PlanLimits {
  return hasPremium(state) ? premiumLimits : freeLimits;
}

/** The latest end among subscriptions that weren't cancelled (refunded). */
export function currentEnd(subs: readonly { endsAt: Date; canceledAt: Date | null }[]): Date | null {
  let end: Date | null = null;
  for (const s of subs) if (!s.canceledAt && (!end || s.endsAt > end)) end = s.endsAt;
  return end;
}

export type PeriodError = "TEST_DATE_REQUIRED" | "TEST_DATE_PASSED" | "TEST_DATE_TOO_FAR";

/**
 * When a newly paid plan runs. Renewals start where the current period ends,
 * so paying early never loses days. "Until test day" ends the day after the
 * test date (at least `minDays` long).
 */
export function nextPeriod(
  plan: PaidPlan,
  opts: { now: Date; currentEnd: Date | null; testDate: Date | null },
): { startsAt: Date; endsAt: Date } | { error: PeriodError } {
  const startsAt = opts.currentEnd && opts.currentEnd > opts.now ? opts.currentEnd : opts.now;
  if (plan.periodDays) return { startsAt, endsAt: new Date(startsAt.getTime() + plan.periodDays * DAY) };
  const rule = plan.untilTestDate!;
  if (!opts.testDate) return { error: "TEST_DATE_REQUIRED" };
  const afterTest = new Date(Date.UTC(opts.testDate.getUTCFullYear(), opts.testDate.getUTCMonth(), opts.testDate.getUTCDate() + 1));
  if (afterTest <= opts.now) return { error: "TEST_DATE_PASSED" };
  if (afterTest.getTime() - opts.now.getTime() > rule.maxDays * DAY) return { error: "TEST_DATE_TOO_FAR" };
  const minEnd = new Date(startsAt.getTime() + rule.minDays * DAY);
  return { startsAt, endsAt: afterTest > minEnd ? afterTest : minEnd };
}

export interface PromoLike {
  percentOff: number | null;
  amountOff: Partial<Record<Currency, number>> | null;
}

/**
 * Price in minor units. The larger of the promo and referral discounts
 * applies (they don't add up). A 100% promo makes the order free.
 */
export function quote(plan: PaidPlan, currency: Currency, opts: { promo?: PromoLike | null; referral?: boolean } = {}) {
  const list = toMinor(plan.price[currency], currency);
  const promo = opts.promo
    ? opts.promo.percentOff
      ? Math.round((list * Math.min(100, opts.promo.percentOff)) / 100)
      : toMinor(opts.promo.amountOff?.[currency] ?? 0, currency)
    : 0;
  const referral = opts.referral ? Math.round((list * billing.referral.friendDiscountPercent) / 100) : 0;
  const discount = Math.min(list, Math.max(promo, referral));
  return { list, discount, amount: list - discount, usedReferral: referral > promo };
}
