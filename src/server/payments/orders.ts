import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { billing, getPaidPlan, type Currency } from "@/config/plans";
import { ENABLED_LOCALES } from "@/i18n/locales";
import { currentEnd, nextPeriod, quote, type PromoLike } from "@/lib/billing/subscription";
import { HttpError } from "@/server/http";
import { audit } from "@/server/audit";
import { sendReceipt } from "./notify";
import { PROVIDER_IDS, type ProviderId } from "./types";

const DAY = 86_400_000;

export const createOrderSchema = z.object({
  planId: z.enum(["monthly", "quarter", "testday"]),
  currency: z.enum(["UZS", "USD"]),
  provider: z.enum(PROVIDER_IDS as [ProviderId, ...ProviderId[]]),
  promoCode: z.string().trim().max(40).optional().nullable(),
  locale: z.enum(ENABLED_LOCALES).default("en"),
});

export function normalizePromo(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

/** A promo code that can be used now for this plan, or an error code. */
export async function findPromo(code: string, planId: string): Promise<{ id: string; promo: PromoLike } | { error: string }> {
  const p = await db.promoCode.findUnique({ where: { code: normalizePromo(code) } });
  const now = new Date();
  if (!p || !p.active) return { error: "PROMO_INVALID" };
  if ((p.validFrom && p.validFrom > now) || (p.validUntil && p.validUntil < now)) return { error: "PROMO_EXPIRED" };
  if (p.planIds.length && !p.planIds.includes(planId)) return { error: "PROMO_NOT_FOR_PLAN" };
  if (p.maxRedemptions !== null) {
    const used = await db.order.count({ where: { promoCodeId: p.id, status: "PAID" } });
    if (used >= p.maxRedemptions) return { error: "PROMO_USED_UP" };
  }
  return { id: p.id, promo: { percentOff: p.percentOff, amountOff: (p.amountOff as Partial<Record<Currency, number>> | null) ?? null } };
}

/** The first purchase of a student who signed up with someone's referral code. */
async function referralApplies(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { referredById: true } });
  if (!user?.referredById) return false;
  return (await db.order.count({ where: { userId, status: { in: ["PAID", "REFUNDED"] } } })) === 0;
}

export async function priceFor(userId: string, planId: string, currency: Currency, promoCode?: string | null) {
  const plan = getPaidPlan(planId);
  if (!plan) throw new HttpError(400, "INVALID_PLAN");
  let promo: { id: string; promo: PromoLike } | null = null;
  if (promoCode) {
    const found = await findPromo(promoCode, planId);
    if ("error" in found) throw new HttpError(422, found.error);
    promo = found;
  }
  const referral = await referralApplies(userId);
  const q = quote(plan, currency, { promo: promo?.promo, referral });
  return { plan, promoId: q.usedReferral || !promo || q.discount === 0 ? null : promo.id, referral: q.usedReferral, ...q };
}

/** Create an order (status CREATED). A free order (100% promo) is paid immediately. */
export async function createOrder(userId: string, raw: unknown, providerSupports: (p: ProviderId, c: Currency) => boolean) {
  const input = createOrderSchema.parse(raw);
  if (!providerSupports(input.provider, input.currency)) throw new HttpError(422, "PROVIDER_UNAVAILABLE");
  const price = await priceFor(userId, input.planId, input.currency, input.promoCode);
  if (price.plan.untilTestDate) {
    const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { testDate: true } });
    const period = nextPeriod(price.plan, { now: new Date(), currentEnd: null, testDate: user.testDate });
    if ("error" in period) throw new HttpError(422, period.error);
  }
  const order = await db.order.create({
    data: {
      userId,
      planId: input.planId,
      provider: price.amount === 0 ? "free" : input.provider,
      currency: input.currency,
      listAmount: price.list,
      discountAmount: price.discount,
      amount: price.amount,
      promoCodeId: price.promoId,
      referral: price.referral,
      locale: input.locale,
    },
  });
  if (price.amount === 0) await markPaid(order.id, { providerRef: "free" });
  return db.order.findUniqueOrThrow({ where: { id: order.id } });
}

export async function markPending(orderId: string, providerRef?: string) {
  await db.order.updateMany({ where: { id: orderId, status: "CREATED" }, data: { status: "PENDING", ...(providerRef ? { providerRef } : {}) } });
}

async function stackSubscription(
  tx: Prisma.TransactionClient,
  userId: string,
  data: { planId: string; source: string; orderId?: string; days?: number; testDate?: Date | null; note?: string },
) {
  const subs = await tx.subscription.findMany({ where: { userId, canceledAt: null }, select: { endsAt: true, canceledAt: true } });
  const now = new Date();
  const end = currentEnd(subs);
  const plan = getPaidPlan(data.planId);
  let period: { startsAt: Date; endsAt: Date };
  if (data.days !== undefined || !plan) {
    const startsAt = end && end > now ? end : now;
    period = { startsAt, endsAt: new Date(startsAt.getTime() + (data.days ?? 30) * DAY) };
  } else {
    const p = nextPeriod(plan, { now, currentEnd: end, testDate: data.testDate ?? null });
    // The test date may have changed since checkout; the plan still runs its minimum length.
    period = "error" in p ? { startsAt: end && end > now ? end : now, endsAt: new Date((end && end > now ? end : now).getTime() + (plan.untilTestDate?.minDays ?? 30) * DAY) } : p;
  }
  return tx.subscription.create({
    data: { userId, planId: data.planId, orderId: data.orderId, source: data.source, note: data.note, ...period },
  });
}

/**
 * Payment confirmed by the provider. Idempotent: only the first call for an
 * order creates the subscription, the referral bonus and the receipt.
 */
export async function markPaid(orderId: string, opts: { providerRef?: string } = {}) {
  const paid = await db.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: orderId, status: { in: ["CREATED", "PENDING", "FAILED", "CANCELED"] } },
      data: { status: "PAID", paidAt: new Date(), failureReason: null, ...(opts.providerRef ? { providerRef: opts.providerRef } : {}) },
    });
    if (claimed.count === 0) return null;
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { user: { select: { id: true, testDate: true, referredById: true } } } });
    await stackSubscription(tx, order.userId, { planId: order.planId, source: "ORDER", orderId: order.id, testDate: order.user.testDate });
    if (order.user.referredById) {
      const earlier = await tx.order.count({ where: { userId: order.userId, status: { in: ["PAID", "REFUNDED"] }, id: { not: order.id } } });
      if (earlier === 0) {
        await stackSubscription(tx, order.user.referredById, {
          planId: "monthly",
          source: "REFERRAL",
          days: billing.referral.referrerBonusDays,
          note: `Referral: order ${order.number}`,
        });
      }
    }
    return order;
  });
  if (paid) {
    await audit(paid.userId, "order.paid", "Order", paid.id, { number: paid.number, amount: paid.amount, currency: paid.currency, provider: paid.provider });
    await sendReceipt(paid.id).catch((e) => console.error("[billing] receipt", e));
  }
  return !!paid;
}

/** Cancelled or failed before payment. Never touches a paid order. */
export async function markCanceled(orderId: string, reason: string, status: "CANCELED" | "FAILED" = "CANCELED") {
  await db.order.updateMany({
    where: { id: orderId, status: { in: ["CREATED", "PENDING"] } },
    data: { status, canceledAt: new Date(), failureReason: reason.slice(0, 200) },
  });
}

/** Money returned: premium from this order stops. */
export async function markRefunded(orderId: string, actorId: string | null = null) {
  const now = new Date();
  const done = await db.$transaction(async (tx) => {
    const r = await tx.order.updateMany({ where: { id: orderId, status: "PAID" }, data: { status: "REFUNDED", refundedAt: now } });
    if (r.count === 0) return false;
    await tx.subscription.updateMany({ where: { orderId, canceledAt: null }, data: { canceledAt: now } });
    return true;
  });
  if (done) await audit(actorId, "order.refunded", "Order", orderId, {});
  return done;
}

/** Unpaid orders older than the limit are cancelled (daily job). */
export async function expireStaleOrders(now = new Date()) {
  const r = await db.order.updateMany({
    where: { status: { in: ["CREATED", "PENDING"] }, createdAt: { lt: new Date(now.getTime() - billing.orderTtlHours * 3_600_000) } },
    data: { status: "CANCELED", canceledAt: now, failureReason: "expired" },
  });
  return r.count;
}

/** Record a provider callback once. Returns false if this exact event was already processed. */
export async function recordEvent(provider: ProviderId, eventId: string, type: string, orderId: string | null, payload: unknown): Promise<boolean> {
  try {
    await db.paymentEvent.create({ data: { provider, eventId, type, orderId, payload: payload as Prisma.InputJsonValue } });
    return true;
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") return false;
    throw e;
  }
}

/** Staff grant (e.g. a scholarship) without an order. */
export async function grantDays(userId: string, days: number, actorId: string, note: string) {
  const sub = await db.$transaction((tx) => stackSubscription(tx, userId, { planId: "monthly", source: "GRANT", days, note }));
  await audit(actorId, "subscription.grant", "User", userId, { days, note });
  return sub;
}
