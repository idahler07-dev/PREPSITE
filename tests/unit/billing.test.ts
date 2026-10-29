import { describe, expect, it } from "vitest";
import { getPaidPlan } from "@/config/plans";
import { currentEnd, hasPremium, nextPeriod, quote, subscriptionState } from "@/lib/billing/subscription";

const d = (s: string) => new Date(s);
const cfg = { expiringSoonDays: 7, graceDays: 3 } as never;

describe("subscription states", () => {
  const end = d("2026-11-30T00:00:00Z");
  it("goes active → expiring → grace → expired", () => {
    expect(subscriptionState(null)).toBe("none");
    expect(subscriptionState(end, d("2026-11-01T00:00:00Z"), cfg)).toBe("active");
    expect(subscriptionState(end, d("2026-11-25T00:00:00Z"), cfg)).toBe("expiring");
    expect(subscriptionState(end, d("2026-12-02T00:00:00Z"), cfg)).toBe("grace");
    expect(subscriptionState(end, d("2026-12-03T00:00:01Z"), cfg)).toBe("expired");
  });
  it("keeps premium during the grace period only", () => {
    expect(["none", "active", "expiring", "grace", "expired"].map((s) => hasPremium(s as never))).toEqual([false, true, true, true, false]);
  });
  it("ignores refunded periods", () => {
    expect(currentEnd([{ endsAt: d("2026-12-01"), canceledAt: null }, { endsAt: d("2027-01-01"), canceledAt: d("2026-11-02") }])).toEqual(d("2026-12-01"));
    expect(currentEnd([])).toBeNull();
  });
});

describe("periods", () => {
  const now = d("2026-11-01T10:00:00Z");
  const monthly = getPaidPlan("monthly")!;
  const testday = getPaidPlan("testday")!;
  it("starts now, or stacks after the current period", () => {
    expect(nextPeriod(monthly, { now, currentEnd: null, testDate: null })).toEqual({ startsAt: now, endsAt: d("2026-12-01T10:00:00Z") });
    expect(nextPeriod(monthly, { now, currentEnd: d("2026-11-20T00:00:00Z"), testDate: null })).toEqual({ startsAt: d("2026-11-20T00:00:00Z"), endsAt: d("2026-12-20T00:00:00Z") });
    expect(nextPeriod(monthly, { now, currentEnd: d("2026-10-01T00:00:00Z"), testDate: null })).toMatchObject({ startsAt: now });
  });
  it("runs until the day after the test (at least the minimum)", () => {
    expect(nextPeriod(testday, { now, currentEnd: null, testDate: d("2027-03-07") })).toEqual({ startsAt: now, endsAt: d("2027-03-08T00:00:00Z") });
    expect(nextPeriod(testday, { now, currentEnd: null, testDate: d("2026-11-05") })).toEqual({ startsAt: now, endsAt: d("2026-11-15T10:00:00Z") });
    expect(nextPeriod(testday, { now, currentEnd: null, testDate: null })).toEqual({ error: "TEST_DATE_REQUIRED" });
    expect(nextPeriod(testday, { now, currentEnd: null, testDate: d("2026-10-30") })).toEqual({ error: "TEST_DATE_PASSED" });
    expect(nextPeriod(testday, { now, currentEnd: null, testDate: d("2028-01-01") })).toEqual({ error: "TEST_DATE_TOO_FAR" });
  });
});

describe("prices", () => {
  const plan = getPaidPlan("monthly")!;
  it("quotes in minor units and applies the bigger discount", () => {
    expect(quote(plan, "UZS")).toEqual({ list: 19_900_000, discount: 0, amount: 19_900_000, usedReferral: false });
    expect(quote(plan, "USD", { promo: { percentOff: 20, amountOff: null } })).toMatchObject({ list: 1900, discount: 380, amount: 1520 });
    expect(quote(plan, "UZS", { promo: { percentOff: null, amountOff: { UZS: 50_000 } } })).toMatchObject({ discount: 5_000_000 });
    expect(quote(plan, "USD", { promo: { percentOff: null, amountOff: { UZS: 50_000 } } })).toMatchObject({ discount: 0 });
    expect(quote(plan, "USD", { promo: { percentOff: 5, amountOff: null }, referral: true })).toMatchObject({ discount: 190, usedReferral: true });
    expect(quote(plan, "USD", { promo: { percentOff: 100, amountOff: null } })).toMatchObject({ amount: 0 });
    expect(quote(plan, "USD", { promo: { percentOff: null, amountOff: { USD: 500 } } })).toMatchObject({ amount: 0, discount: 1900 });
  });
});
