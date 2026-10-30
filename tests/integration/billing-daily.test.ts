import { readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { makeUser, resetDb } from "./helpers";

process.env.EMAIL_TRANSPORT = "outbox";
const remote = vi.hoisted(() => ({ status: "paid" as string }));
vi.mock("@/server/payments", async (orig) => {
  const real = await orig<typeof import("@/server/payments")>();
  const fake = { id: "fake", currencies: ["UZS"], configured: () => true, fetchStatus: async () => remote.status };
  return { ...real, getProvider: (id: string) => (id === "fake" ? fake : real.getProvider(id)) };
});

const { runBillingDaily, sendRenewalReminders } = await import("@/server/billing/daily");
const OUTBOX = path.join(process.cwd(), ".data", "dev-mail");
const DAY = 86_400_000;

async function premiumUntil(endsAt: Date) {
  const user = await makeUser();
  await db.subscription.create({ data: { userId: user.id, planId: "monthly", source: "GRANT", startsAt: new Date(endsAt.getTime() - 30 * DAY), endsAt } });
  return user;
}
const mailsTo = (email: string) => {
  try {
    return readdirSync(OUTBOX).filter((f) => f.endsWith(`-${email.replace(/[^a-z0-9@._-]/gi, "_")}.json`)).length;
  } catch {
    return 0;
  }
};

describe("daily billing job", () => {
  beforeEach(async () => {
    await resetDb();
    rmSync(OUTBOX, { recursive: true, force: true });
  });

  it("sends each renewal reminder once (3 days, then 1 day before)", async () => {
    const now = new Date("2026-11-10T09:00:00Z");
    const soon = await premiumUntil(new Date(now.getTime() + 2.5 * DAY));
    const later = await premiumUntil(new Date(now.getTime() + 10 * DAY));
    expect(await sendRenewalReminders(now)).toBe(1);
    expect(await sendRenewalReminders(now)).toBe(0);
    expect(mailsTo(soon.email!)).toBe(1);
    expect(mailsTo(later.email!)).toBe(0);
    expect(await sendRenewalReminders(new Date(now.getTime() + 1.8 * DAY))).toBe(1); // the 1-day reminder
    expect(await db.billingReminder.findMany({ select: { daysBefore: true } })).toEqual(expect.arrayContaining([{ daysBefore: 3 }, { daysBefore: 1 }]));
  });

  it("does not remind a student who already renewed", async () => {
    const now = new Date("2026-11-10T09:00:00Z");
    const user = await premiumUntil(new Date(now.getTime() + 2 * DAY));
    await db.subscription.create({ data: { userId: user.id, planId: "monthly", source: "ORDER", startsAt: new Date(now.getTime() + 2 * DAY), endsAt: new Date(now.getTime() + 32 * DAY) } });
    expect(await sendRenewalReminders(now)).toBe(0);
  });

  it("expires stale unpaid orders and reconciles with the provider", async () => {
    const user = await makeUser();
    const base = { userId: user.id, planId: "monthly", currency: "UZS", listAmount: 100, amount: 100 };
    const stale = await db.order.create({ data: { ...base, provider: "mock", createdAt: new Date(Date.now() - 2 * DAY) } });
    const pending = await db.order.create({ data: { ...base, provider: "fake", status: "PENDING", createdAt: new Date(Date.now() - 3_600_000) } });
    remote.status = "paid";
    const r = await runBillingDaily();
    expect(r.expired).toBe(1);
    expect(r.issues).toEqual([{ order: pending.number, ours: "PENDING", theirs: "paid", fixed: true }]);
    expect((await db.order.findUniqueOrThrow({ where: { id: stale.id } })).status).toBe("CANCELED");
    expect((await db.order.findUniqueOrThrow({ where: { id: pending.id } })).status).toBe("PAID");
    expect(await db.subscription.count({ where: { userId: user.id } })).toBe(1);

    remote.status = "refunded";
    await runBillingDaily();
    expect((await db.order.findUniqueOrThrow({ where: { id: pending.id } })).status).toBe("REFUNDED");
  });
});
