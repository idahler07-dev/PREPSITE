"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRole } from "@/server/auth/session";
import { HttpError } from "@/server/http";
import { audit } from "@/server/audit";
import { getProvider } from "@/server/payments";
import { grantDays, markRefunded, normalizePromo } from "@/server/payments/orders";

type Result<T = null> = { ok: true; data: T } | { ok: false; error: string };

async function run<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof HttpError) return { ok: false, error: e.code };
    if (e instanceof z.ZodError) return { ok: false, error: "VALIDATION" };
    console.error("[admin billing]", e);
    return { ok: false, error: "INTERNAL" };
  }
}

const ADMIN = ["ADMIN"] as const;

/** Refund through the provider; Payme (and Click without API access) are refunded in the provider's cabinet. */
export async function refundOrder(orderId: string) {
  return run(async () => {
    const admin = await requireApiRole(ADMIN);
    const order = await db.order.findUnique({ where: { id: z.string().max(40).parse(orderId) } });
    if (!order || order.status !== "PAID") throw new HttpError(409, "NOT_REFUNDABLE");
    if (order.provider === "free") {
      await markRefunded(order.id, admin.id);
      return "refunded" as const;
    }
    const provider = getProvider(order.provider);
    if (!provider) throw new HttpError(409, "NOT_REFUNDABLE");
    const result = await provider.refund({ id: order.id, amount: order.amount, currency: order.currency as "UZS", providerRef: order.providerRef });
    if (result === "refunded") await markRefunded(order.id, admin.id);
    else await db.order.update({ where: { id: order.id }, data: { refundRequestedAt: new Date() } });
    await audit(admin.id, `order.refund.${result}`, "Order", order.id, { provider: order.provider });
    revalidatePath("/[locale]/admin/orders", "page");
    return result;
  });
}

/** After refunding in a provider's cabinet when its callback didn't arrive. */
export async function markOrderRefundedManually(orderId: string) {
  return run(async () => {
    const admin = await requireApiRole(ADMIN);
    if (!(await markRefunded(z.string().max(40).parse(orderId), admin.id))) throw new HttpError(409, "NOT_REFUNDABLE");
    revalidatePath("/[locale]/admin/orders", "page");
    return null;
  });
}

const promoSchema = z
  .object({
    code: z.string().transform(normalizePromo).pipe(z.string().regex(/^[A-Z0-9_-]{3,40}$/)),
    kind: z.enum(["percent", "amount"]),
    percentOff: z.coerce.number().int().min(1).max(100).optional(),
    amountUZS: z.coerce.number().int().min(0).optional(),
    amountUSD: z.coerce.number().min(0).optional(),
    planIds: z.array(z.enum(["monthly", "quarter", "testday"])).default([]),
    maxRedemptions: z.coerce.number().int().min(1).optional().nullable(),
    validUntil: z.string().optional().nullable(),
    note: z.string().max(200).optional(),
  })
  .refine((p) => (p.kind === "percent" ? !!p.percentOff : (p.amountUZS ?? 0) > 0 || (p.amountUSD ?? 0) > 0), { message: "DISCOUNT_REQUIRED" });

export async function createPromo(raw: unknown) {
  return run(async () => {
    const admin = await requireApiRole(ADMIN);
    const p = promoSchema.parse(raw);
    if (await db.promoCode.findUnique({ where: { code: p.code } })) throw new HttpError(409, "CODE_TAKEN");
    const promo = await db.promoCode.create({
      data: {
        code: p.code,
        percentOff: p.kind === "percent" ? p.percentOff : null,
        amountOff: p.kind === "amount" ? { UZS: p.amountUZS ?? 0, USD: p.amountUSD ?? 0 } : undefined,
        planIds: p.planIds,
        maxRedemptions: p.maxRedemptions ?? null,
        validUntil: p.validUntil ? new Date(`${p.validUntil}T23:59:59+05:00`) : null,
        note: p.note || null,
        createdById: admin.id,
      },
    });
    await audit(admin.id, "promo.create", "PromoCode", promo.id, { code: promo.code });
    revalidatePath("/[locale]/admin/promos", "page");
    return null;
  });
}

export async function setPromoActive(id: string, active: boolean) {
  return run(async () => {
    const admin = await requireApiRole(ADMIN);
    await db.promoCode.update({ where: { id: z.string().max(40).parse(id) }, data: { active } });
    await audit(admin.id, active ? "promo.activate" : "promo.deactivate", "PromoCode", id, {});
    revalidatePath("/[locale]/admin/promos", "page");
    return null;
  });
}

const grantSchema = z.object({ email: z.string().trim().toLowerCase().email(), days: z.coerce.number().int().min(1).max(400), note: z.string().trim().min(1).max(200) });

/** Free premium days for a student (scholarship, apology, staff testing). */
export async function grantPremium(raw: unknown) {
  return run(async () => {
    const admin = await requireApiRole(ADMIN);
    const g = grantSchema.parse(raw);
    const user = await db.user.findUnique({ where: { email: g.email }, select: { id: true } });
    if (!user) throw new HttpError(404, "USER_NOT_FOUND");
    await grantDays(user.id, g.days, admin.id, g.note);
    revalidatePath("/[locale]/admin/orders", "page");
    return null;
  });
}
