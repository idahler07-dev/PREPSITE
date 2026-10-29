import "server-only";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { fromMinor } from "@/config/plans";
import { markCanceled, markPaid, markPending } from "../orders";
import type { PaymentProvider } from "../types";
import { json, md5, safeEqual, sha1 } from "../util";

/**
 * Click SHOP API. Click sends two form-encoded requests to our URL:
 * Prepare (action=0) and Complete (action=1), each signed with
 * sign_string = md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id
 *                   [+ merchant_prepare_id for Complete] + amount + action + sign_time).
 * merchant_trans_id is our order number. Amounts are in so'm.
 * Docs: https://docs.click.uz
 */

const E = {
  OK: [0, "Success"],
  SIGN: [-1, "SIGN CHECK FAILED!"],
  AMOUNT: [-2, "Incorrect parameter amount"],
  ACTION: [-3, "Action not found"],
  PAID: [-4, "Already paid"],
  ORDER: [-5, "User does not exist"],
  TXN: [-6, "Transaction does not exist"],
  UPDATE: [-7, "Failed to update user"],
  REQUEST: [-8, "Error in request from click"],
  CANCELED: [-9, "Transaction cancelled"],
} as const;
type ClickError = (typeof E)[keyof typeof E];

export interface ClickParams {
  click_trans_id: string;
  service_id: string;
  click_paydoc_id?: string;
  merchant_trans_id: string;
  merchant_prepare_id?: string;
  amount: string;
  action: string;
  error: string;
  error_note?: string;
  sign_time: string;
  sign_string: string;
}

export function clickSign(p: Omit<ClickParams, "sign_string">, secret: string): string {
  const prepare = p.action === "1" ? (p.merchant_prepare_id ?? "") : "";
  return md5(`${p.click_trans_id}${p.service_id}${secret}${p.merchant_trans_id}${prepare}${p.amount}${p.action}${p.sign_time}`);
}

export function clickCheckoutUrl(opts: { serviceId: string; merchantId: string; amountSum: number; orderNumber: number; returnUrl: string }): string {
  const q = new URLSearchParams({
    service_id: opts.serviceId,
    merchant_id: opts.merchantId,
    amount: opts.amountSum.toFixed(2),
    transaction_param: String(opts.orderNumber),
    return_url: opts.returnUrl,
  });
  return `https://my.click.uz/services/pay?${q}`;
}

function reply(p: Partial<ClickParams>, err: ClickError, extra: Record<string, unknown> = {}) {
  return { click_trans_id: p.click_trans_id ? Number(p.click_trans_id) : null, merchant_trans_id: p.merchant_trans_id ?? null, ...extra, error: err[0], error_note: err[1] };
}

const sameAmount = (clickAmount: string, minor: number) => Math.abs(Number(clickAmount) - fromMinor(minor, "UZS")) < 0.005;

export async function processClickRequest(p: Partial<ClickParams>, cfg: { serviceId?: string; secret?: string }): Promise<Record<string, unknown>> {
  const required = ["click_trans_id", "service_id", "merchant_trans_id", "amount", "action", "error", "sign_time", "sign_string"] as const;
  if (required.some((k) => p[k] === undefined || p[k] === null)) return reply(p, E.REQUEST);
  const params = p as ClickParams;
  if (!cfg.secret || params.service_id !== cfg.serviceId || !safeEqual(params.sign_string, clickSign(params, cfg.secret))) return reply(p, E.SIGN);
  if (params.action !== "0" && params.action !== "1") return reply(p, E.ACTION);

  const number = Number(params.merchant_trans_id);
  const order = Number.isInteger(number) ? await db.order.findUnique({ where: { number } }) : null;
  if (!order || order.provider !== "click" || order.currency !== "UZS") return reply(p, E.ORDER);
  if (!sameAmount(params.amount, order.amount)) return reply(p, E.AMOUNT);

  const externalId = params.click_trans_id;
  const existing = await db.paymentTransaction.findUnique({ where: { provider_externalId: { provider: "click", externalId } } });

  if (params.action === "0") {
    if (order.status === "PAID") return reply(p, E.PAID);
    if (order.status === "CANCELED" || order.status === "FAILED" || order.status === "REFUNDED") return reply(p, E.CANCELED);
    const t =
      existing ??
      (await db.paymentTransaction.create({
        data: { provider: "click", externalId, orderId: order.id, amount: order.amount, state: 0, data: { click_paydoc_id: params.click_paydoc_id ?? null } },
      }));
    await markPending(order.id, externalId);
    return reply(p, E.OK, { merchant_prepare_id: order.number, ...(t ? {} : {}) });
  }

  // Complete
  if (!existing || String(order.number) !== String(params.merchant_prepare_id)) return reply(p, E.TXN);
  if (existing.state === 1) return reply(p, E.OK, { merchant_confirm_id: order.number }); // repeated Complete for the same payment
  if (existing.state === -1) return reply(p, E.CANCELED);
  if (Number(params.error) < 0) {
    // Click reports the payment failed on its side.
    await db.paymentTransaction.update({ where: { id: existing.id }, data: { state: -1, canceledAt: new Date(), reason: Number(params.error) } });
    await markCanceled(order.id, `click error ${params.error}: ${params.error_note ?? ""}`);
    return reply(p, E.CANCELED);
  }
  if (order.status === "PAID") return reply(p, E.PAID);
  if (order.status === "REFUNDED") return reply(p, E.CANCELED);
  await db.paymentTransaction.update({ where: { id: existing.id }, data: { state: 1, performedAt: new Date() } });
  await markPaid(order.id, { providerRef: externalId });
  return reply(p, E.OK, { merchant_confirm_id: order.number });
}

export const clickProvider: PaymentProvider = {
  id: "click",
  currencies: ["UZS"],
  configured: () => !!(env().CLICK_SERVICE_ID && env().CLICK_MERCHANT_ID && env().CLICK_SECRET_KEY),
  // Click has no separate sandbox host; use a test service in the Click cabinet.
  sandbox: () => false,
  async createCheckout(order, urls) {
    return {
      redirectUrl: clickCheckoutUrl({
        serviceId: env().CLICK_SERVICE_ID!,
        merchantId: env().CLICK_MERCHANT_ID!,
        amountSum: fromMinor(order.amount, "UZS"),
        orderNumber: order.number,
        returnUrl: urls.returnUrl,
      }),
    };
  },
  async handleWebhook(req) {
    const form = new URLSearchParams(await req.text());
    const params = Object.fromEntries(form.entries()) as Partial<ClickParams>;
    return json(await processClickRequest(params, { serviceId: env().CLICK_SERVICE_ID, secret: env().CLICK_SECRET_KEY }));
  },
  /**
   * Click Merchant API payment reversal. TODO: confirm with Click support
   * that reversal is enabled for your service and which id it expects.
   */
  async refund(order) {
    const e = env();
    if (!e.CLICK_MERCHANT_USER_ID || !order.providerRef) return "manual";
    const t = await db.paymentTransaction.findFirst({ where: { provider: "click", orderId: order.id, state: 1 } });
    const paymentId = (t?.data as { click_paydoc_id?: string } | null)?.click_paydoc_id ?? order.providerRef;
    const ts = Math.floor(Date.now() / 1000);
    const res = await fetch(`https://api.click.uz/v2/merchant/payment/reversal/${e.CLICK_SERVICE_ID}/${paymentId}`, {
      method: "DELETE",
      headers: { Accept: "application/json", Auth: `${e.CLICK_MERCHANT_USER_ID}:${sha1(`${ts}${e.CLICK_SECRET_KEY}`)}:${ts}` },
      signal: AbortSignal.timeout(20_000),
    });
    const body = (await res.json().catch(() => ({}))) as { error_code?: number };
    return res.ok && body.error_code === 0 ? "refunded" : "manual";
  },
};
