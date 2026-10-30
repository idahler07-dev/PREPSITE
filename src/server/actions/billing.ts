"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { billing } from "@/config/plans";
import { nextPeriod } from "@/lib/billing/subscription";
import { requireApiUser } from "@/server/auth/session";
import { HttpError } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { getEntitlement } from "@/server/billing/entitlement";
import { createOrder, priceFor } from "@/server/payments/orders";
import { getProvider, providerSupports } from "@/server/payments";
import { mockCallback, mockProvider, processMockEvent } from "@/server/payments/providers/mock";

type Fail = { ok: false; error: string };
const fail = (e: unknown): Fail => {
  if (e instanceof HttpError) return { ok: false, error: e.code };
  if (e instanceof z.ZodError) return { ok: false, error: "VALIDATION" };
  console.error("[billing]", e);
  return { ok: false, error: "INTERNAL" };
};

const previewSchema = z.object({ planId: z.string().max(20), currency: z.enum(["UZS", "USD"]), promoCode: z.string().max(40).optional().nullable() });

/** Price shown on the checkout page (the same calculation the order uses). */
export async function previewPrice(raw: unknown) {
  try {
    const user = await requireApiUser();
    const input = previewSchema.parse(raw);
    const p = await priceFor(user.id, input.planId, input.currency, input.promoCode || null);
    const [ent, profile] = await Promise.all([getEntitlement(user.id), db.user.findUniqueOrThrow({ where: { id: user.id }, select: { testDate: true } })]);
    const period = nextPeriod(p.plan, { now: new Date(), currentEnd: ent.endsAt, testDate: profile.testDate });
    return {
      ok: true as const,
      list: p.list,
      discount: p.discount,
      amount: p.amount,
      referral: p.referral,
      referralPercent: billing.referral.friendDiscountPercent,
      promoApplied: !!p.promoId,
      endsAt: "error" in period ? null : period.endsAt.toISOString(),
      periodError: "error" in period ? period.error : null,
    };
  } catch (e) {
    return fail(e);
  }
}

/** Create the order and get the provider's hosted checkout URL. */
export async function startCheckout(raw: unknown): Promise<{ ok: true; redirectUrl: string } | Fail> {
  try {
    const user = await requireApiUser();
    if (!(await rateLimit(`checkout:${user.id}`, 10, 600)).ok) throw new HttpError(429, "RATE_LIMITED");
    const order = await createOrder(user.id, raw, providerSupports);
    const site = env().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
    const returnUrl = `${site}/payments/return?order=${order.id}`;
    if (order.status === "PAID") return { ok: true, redirectUrl: returnUrl };
    const provider = getProvider(order.provider)!;
    const { redirectUrl, providerRef } = await provider.createCheckout(
      { id: order.id, number: order.number, amount: order.amount, currency: order.currency as "UZS", planId: order.planId, locale: order.locale, user: { id: user.id, email: user.email ?? null } },
      { returnUrl, notifyUrl: `${site}/api/payments/${provider.id}/webhook` },
    );
    if (providerRef) await db.order.update({ where: { id: order.id }, data: { providerRef } });
    return { ok: true, redirectUrl };
  } catch (e) {
    return fail(e);
  }
}

/** The mock provider's "pay" or "decline" button: sends a signed callback exactly as a provider would. */
export async function mockCheckoutDecision(orderId: string, outcome: "paid" | "failed") {
  const user = await requireApiUser();
  if (!mockProvider.configured()) return { ok: false as const, error: "NOT_FOUND" };
  const order = await db.order.findUnique({ where: { id: z.string().max(40).parse(orderId) } });
  if (!order || order.userId !== user.id || order.provider !== "mock") return { ok: false as const, error: "NOT_FOUND" };
  const cb = mockCallback({ orderId: order.id, status: outcome === "paid" ? "paid" : "failed", amount: order.amount, currency: order.currency as "UZS" });
  await processMockEvent(cb.body, cb.signature);
  return { ok: true as const, returnPath: `/payments/return?order=${order.id}` };
}

