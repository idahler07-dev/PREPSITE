/**
 * Plans and prices. PLACEHOLDER PRICES — set your real prices before launch.
 *
 * Prices are whole units (so'm for UZS, dollars for USD). UZS is charged
 * through local cards (Payme, Click); USD through international cards (Octo).
 */
export type Currency = "UZS" | "USD";
export type PaidPlanId = "monthly" | "quarter" | "testday";
export type PlanId = "free" | PaidPlanId;

export interface PlanLimits {
  /** Practice questions a student can start per day (drills, daily question, reviews). null = no limit. */
  questionsPerDay: number | null;
  /** Practice tests (full, section or module) a student can start in total. null = no limit. */
  practiceTests: number | null;
  /** New AI tutor answers per day (see also src/config/ai-limits.ts). */
  aiAnswersPerDay: number;
}

export interface PaidPlan {
  id: PaidPlanId;
  price: Record<Currency, number>;
  /** Length of a fixed-period plan in days. */
  periodDays?: number;
  /** "Until test day": runs until the student's test date (from their profile). */
  untilTestDate?: { minDays: number; maxDays: number };
  /** Highlighted on the pricing page. */
  featured?: boolean;
}

export const freeLimits: PlanLimits = { questionsPerDay: 20, practiceTests: 1, aiAnswersPerDay: 10 };
export const premiumLimits: PlanLimits = { questionsPerDay: null, practiceTests: null, aiAnswersPerDay: 100 };

export const paidPlans: PaidPlan[] = [
  { id: "monthly", periodDays: 30, price: { UZS: 199_000, USD: 19 } },
  { id: "quarter", periodDays: 90, price: { UZS: 499_000, USD: 45 }, featured: true },
  { id: "testday", untilTestDate: { minDays: 14, maxDays: 365 }, price: { UZS: 899_000, USD: 79 } },
];

export const billing = {
  /** Shown as "expiring soon" this many days before the end. */
  expiringSoonDays: 7,
  /** Premium keeps working this many days after the end. */
  graceDays: 3,
  /** Renewal reminders (email and Telegram) this many days before the end. */
  reminderDays: [3, 1],
  /** Unpaid orders are cancelled after this many hours. */
  orderTtlHours: 24,
  referral: {
    /** Discount for a referred student's first purchase, in percent. */
    friendDiscountPercent: 10,
    /** Free premium days for the referrer when that friend pays. */
    referrerBonusDays: 7,
  },
  /** Fiscal receipt data for Payme/Octo (Uzbek tax rules). TODO: your IKPU (MXIK) code and package code from tasnif.soliq.uz. */
  fiscal: { ikpu: "", packageCode: "", vatPercent: 0, inn: "" },
};

export function getPaidPlan(id: string): PaidPlan | undefined {
  return paidPlans.find((p) => p.id === id);
}

/** Smallest currency unit: tiyin for UZS (Payme counts in tiyin), cents for USD. */
export function toMinor(amount: number, _currency: Currency): number {
  return Math.round(amount * 100);
}

export function fromMinor(minor: number, _currency: Currency): number {
  return minor / 100;
}
