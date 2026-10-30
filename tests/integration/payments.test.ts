import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { makeUser, resetDb } from "./helpers";

process.env.PAYME_KEY = "payme-test-key";
process.env.PAYME_MERCHANT_ID = "m123";
process.env.CLICK_SECRET_KEY = "click-secret";
process.env.CLICK_SERVICE_ID = "777";
process.env.CLICK_MERCHANT_ID = "555";
process.env.PAYMENT_PROVIDERS = "mock,payme,click,octo";
process.env.EMAIL_TRANSPORT = "outbox";
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

const { createOrder, markRefunded } = await import("@/server/payments/orders");
const { providerSupports } = await import("@/server/payments");
const { mockCallback, processMockEvent } = await import("@/server/payments/providers/mock");
const { processPaymeRequest } = await import("@/server/payments/providers/payme");
const { processClickRequest, clickSign } = await import("@/server/payments/providers/click");
const { applyOctoStatus } = await import("@/server/payments/providers/octo");
const { getEntitlement, assertQuestionAllowance, assertTestAllowance } = await import("@/server/billing/entitlement");
const { applyReferral, ensureReferralCode } = await import("@/server/billing/referral");

const order = (userId: string, o: Record<string, unknown> = {}) =>
  createOrder(userId, { planId: "monthly", currency: "UZS", provider: "mock", locale: "en", ...o }, providerSupports);

async function payMock(o: { id: string; amount: number; currency: string }) {
  const cb = mockCallback({ orderId: o.id, status: "paid", amount: o.amount, currency: o.currency as "UZS" });
  return processMockEvent(cb.body, cb.signature);
}

describe("orders and subscriptions (mock provider)", () => {
  beforeEach(resetDb);

  it("verifies the signature, checks the amount, ignores repeats and activates premium", async () => {
    const user = await makeUser();
    expect((await getEntitlement(user.id)).premium).toBe(false);
    const o = await order(user.id);
    expect(o).toMatchObject({ status: "CREATED", amount: 19_900_000, currency: "UZS" });

    const cb = mockCallback({ orderId: o.id, status: "paid", amount: o.amount, currency: "UZS" });
    expect((await processMockEvent(cb.body, "0".repeat(64))).status).toBe(401);
    const wrong = mockCallback({ orderId: o.id, status: "paid", amount: 1, currency: "UZS" });
    expect((await processMockEvent(wrong.body, wrong.signature)).status).toBe(422);

    expect((await processMockEvent(cb.body, cb.signature)).status).toBe(200);
    expect(await processMockEvent(cb.body, cb.signature)).toMatchObject({ body: { duplicate: true } });
    expect(await db.subscription.count()).toBe(1);
    const ent = await getEntitlement(user.id);
    expect(ent).toMatchObject({ premium: true, state: "active", planId: "monthly" });

    // A renewal paid early starts when the current period ends.
    const o2 = await order(user.id, { planId: "quarter" });
    await payMock(o2);
    const subs = await db.subscription.findMany({ orderBy: { startsAt: "asc" } });
    expect(subs[1]!.startsAt).toEqual(subs[0]!.endsAt);

    // Refund: premium from that order stops.
    await markRefunded(o2.id);
    expect((await getEntitlement(user.id)).endsAt).toEqual(subs[0]!.endsAt);
    expect(await db.order.findUniqueOrThrow({ where: { id: o2.id } })).toMatchObject({ status: "REFUNDED" });
  });

  it("enforces free limits on the server and lifts them with premium", async () => {
    const user = await makeUser();
    await expect(assertQuestionAllowance(user.id, 21)).rejects.toMatchObject({ status: 402, code: "DAILY_LIMIT", message: "20" });
    await assertQuestionAllowance(user.id, 20);
    await db.attempt.create({ data: { userId: user.id, kind: "MOCK", config: {} } });
    await expect(assertTestAllowance(user.id)).rejects.toMatchObject({ code: "TEST_LIMIT" });
    await payMock(await order(user.id));
    await assertQuestionAllowance(user.id, 500);
    await assertTestAllowance(user.id);
  });

  it("applies promo codes, limits their use and activates a 100% promo without payment", async () => {
    const user = await makeUser();
    await db.promoCode.create({ data: { code: "SPRING20", percentOff: 20, maxRedemptions: 1 } });
    await db.promoCode.create({ data: { code: "FREEMONTH", percentOff: 100, planIds: ["monthly"] } });
    const o = await order(user.id, { promoCode: "spring20" });
    expect(o).toMatchObject({ listAmount: 19_900_000, discountAmount: 3_980_000, amount: 15_920_000 });
    await payMock(o);
    await expect(order(user.id, { promoCode: "SPRING20" })).rejects.toMatchObject({ code: "PROMO_USED_UP" });
    await expect(order(user.id, { promoCode: "FREEMONTH", planId: "quarter" })).rejects.toMatchObject({ code: "PROMO_NOT_FOR_PLAN" });
    await expect(order(user.id, { promoCode: "NOPE" })).rejects.toMatchObject({ code: "PROMO_INVALID" });
    const free = await order(user.id, { promoCode: "FREEMONTH" });
    expect(free).toMatchObject({ amount: 0, status: "PAID", provider: "free" });
  });

  it("gives a referred friend a discount and the referrer bonus days, once", async () => {
    const referrer = await makeUser();
    const friend = await makeUser();
    const code = await ensureReferralCode(referrer.id);
    expect(await ensureReferralCode(referrer.id)).toBe(code);
    await applyReferral(friend.id, code);
    await applyReferral(referrer.id, code); // can't refer yourself
    const o = await order(friend.id, { currency: "USD" });
    expect(o).toMatchObject({ listAmount: 1900, discountAmount: 190, referral: true });
    await payMock(o);
    const bonus = await db.subscription.findFirstOrThrow({ where: { userId: referrer.id } });
    expect(bonus.source).toBe("REFERRAL");
    expect(bonus.endsAt.getTime() - bonus.startsAt.getTime()).toBe(7 * 86_400_000);
    const again = await order(friend.id, { currency: "USD" });
    expect(again.discountAmount).toBe(0);
    await payMock(again);
    expect(await db.subscription.count({ where: { userId: referrer.id } })).toBe(1);
  });

  it("requires a test date for the until-test-day plan", async () => {
    const user = await makeUser();
    await expect(order(user.id, { planId: "testday" })).rejects.toMatchObject({ code: "TEST_DATE_REQUIRED" });
    await db.user.update({ where: { id: user.id }, data: { testDate: new Date(Date.now() + 60 * 86_400_000) } });
    const o = await order(user.id, { planId: "testday" });
    await payMock(o);
    const sub = await db.subscription.findFirstOrThrow({ where: { userId: user.id } });
    expect(sub.endsAt.getTime()).toBeGreaterThan(Date.now() + 59 * 86_400_000);
  });
});

describe("Payme Merchant API", () => {
  beforeEach(resetDb);
  const auth = `Basic ${Buffer.from("Paycom:payme-test-key").toString("base64")}`;
  const rpc = async (method: string, params: Record<string, unknown>, a: string | null = auth) =>
    (await processPaymeRequest(JSON.stringify({ id: 1, method, params }), a, "payme-test-key")) as { result?: Record<string, unknown>; error?: { code: number } };

  it("rejects bad credentials, unknown orders and wrong amounts", async () => {
    const user = await makeUser();
    const o = await order(user.id, { provider: "payme" });
    expect((await rpc("CheckPerformTransaction", { amount: o.amount, account: { order_id: o.number } }, null)).error!.code).toBe(-32504);
    expect((await rpc("CheckPerformTransaction", { amount: o.amount, account: { order_id: o.number } }, `Basic ${Buffer.from("Paycom:wrong").toString("base64")}`)).error!.code).toBe(-32504);
    expect((await rpc("CheckPerformTransaction", { amount: o.amount, account: { order_id: 999999 } })).error!.code).toBe(-31050);
    expect((await rpc("CheckPerformTransaction", { amount: o.amount - 100, account: { order_id: o.number } })).error!.code).toBe(-31001);
    expect((await rpc("CheckPerformTransaction", { amount: o.amount, account: { order_id: o.number } })).result).toEqual({ allow: true });
    expect((await rpc("Nope", {})).error!.code).toBe(-32601);
  });

  it("creates, performs (idempotently) and cancels after perform as a refund", async () => {
    const user = await makeUser();
    const o = await order(user.id, { provider: "payme" });
    const create = { id: "pm-1", time: Date.now(), amount: o.amount, account: { order_id: o.number } };
    const c1 = await rpc("CreateTransaction", create);
    expect(c1.result).toMatchObject({ state: 1 });
    expect((await rpc("CreateTransaction", create)).result).toEqual(c1.result); // same answer on retry
    expect((await rpc("CreateTransaction", { ...create, id: "pm-2" })).error!.code).toBe(-31052); // order busy
    expect((await db.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe("PENDING");

    const p1 = await rpc("PerformTransaction", { id: "pm-1" });
    expect(p1.result).toMatchObject({ state: 2 });
    expect((await rpc("PerformTransaction", { id: "pm-1" })).result).toEqual(p1.result);
    expect((await db.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe("PAID");
    expect((await getEntitlement(user.id)).premium).toBe(true);
    expect((await rpc("CheckTransaction", { id: "pm-1" })).result).toMatchObject({ state: 2, reason: null });
    expect((await rpc("CreateTransaction", { ...create, id: "pm-3" })).error!.code).toBe(-31051); // already paid

    const cancel = await rpc("CancelTransaction", { id: "pm-1", reason: 5 });
    expect(cancel.result).toMatchObject({ state: -2 });
    expect((await db.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe("REFUNDED");
    expect((await getEntitlement(user.id)).premium).toBe(false);
    expect((await rpc("PerformTransaction", { id: "missing" })).error!.code).toBe(-31003);
    const st = await rpc("GetStatement", { from: 0, to: Date.now() + 1000 });
    expect((st.result!.transactions as unknown[]).length).toBe(1);
  });

  it("cancels a transaction that timed out", async () => {
    const user = await makeUser();
    const o = await order(user.id, { provider: "payme" });
    await rpc("CreateTransaction", { id: "pm-old", time: Date.now() - 13 * 3_600_000, amount: o.amount, account: { order_id: o.number } });
    expect((await rpc("PerformTransaction", { id: "pm-old" })).error!.code).toBe(-31008);
    expect((await rpc("CheckTransaction", { id: "pm-old" })).result).toMatchObject({ state: -1, reason: 4 });
    expect((await db.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe("CANCELED");
  });
});

describe("Click SHOP API", () => {
  beforeEach(resetDb);
  const cfg = { serviceId: "777", secret: "click-secret" };
  function req(o: { number: number }, action: "0" | "1", extra: Record<string, string> = {}) {
    const p = {
      click_trans_id: "9001",
      service_id: "777",
      click_paydoc_id: "123",
      merchant_trans_id: String(o.number),
      amount: "199000.00",
      action,
      error: "0",
      error_note: "Success",
      sign_time: "2026-10-29 12:00:00",
      ...(action === "1" ? { merchant_prepare_id: String(o.number) } : {}),
      ...extra,
    };
    return { ...p, sign_string: clickSign(p, "click-secret") };
  }

  it("checks the signature and amount, prepares and completes once", async () => {
    const user = await makeUser();
    const o = await order(user.id, { provider: "click" });
    expect(await processClickRequest({ ...req(o, "0"), sign_string: "bad" }, cfg)).toMatchObject({ error: -1 });
    expect(await processClickRequest(req(o, "0", { amount: "1000.00" }), cfg)).toMatchObject({ error: -2 });
    expect(await processClickRequest(req({ number: 1 }, "0"), cfg)).toMatchObject({ error: -5 });
    expect(await processClickRequest(req(o, "0"), cfg)).toMatchObject({ error: 0, merchant_prepare_id: o.number });
    expect(await processClickRequest(req(o, "1"), cfg)).toMatchObject({ error: 0, merchant_confirm_id: o.number });
    expect(await processClickRequest(req(o, "1"), cfg)).toMatchObject({ error: 0 }); // retry of the same payment
    expect((await db.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe("PAID");
    expect(await db.subscription.count()).toBe(1);
    expect(await processClickRequest(req(o, "0", { click_trans_id: "9002" }), cfg)).toMatchObject({ error: -4 });
  });

  it("cancels when Click reports a failed payment", async () => {
    const user = await makeUser();
    const o = await order(user.id, { provider: "click" });
    await processClickRequest(req(o, "0"), cfg);
    expect(await processClickRequest(req(o, "1", { error: "-5017", error_note: "Insufficient funds" }), cfg)).toMatchObject({ error: -9 });
    expect((await db.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe("CANCELED");
  });
});

describe("Octo", () => {
  beforeEach(resetDb);
  it("only marks paid when the re-checked amount matches", async () => {
    const user = await makeUser();
    const o = await order(user.id, { provider: "mock", currency: "USD" });
    await applyOctoStatus(o, { status: "paid", uuid: "u1", totalSum: 1 });
    expect((await db.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe("CREATED");
    await applyOctoStatus(o, { status: "paid", uuid: "u1", totalSum: 19 });
    expect((await db.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe("PAID");
  });
});
