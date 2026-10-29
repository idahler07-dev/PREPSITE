import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { fromMinor, type Currency } from "@/config/plans";
import { markCanceled, markPaid, markPending, markRefunded, recordEvent } from "../orders";
import type { PaymentProvider, ProviderStatus } from "../types";
import { json, tashkentTime } from "../util";

/**
 * Octo (octo.uz) one-stage payments for international cards (USD).
 * Checkout: POST /prepare_payment → octo_pay_url. Octo then POSTs status
 * changes to our notify URL. We never trust the notification body alone:
 * the status is re-read from Octo's API before anything changes.
 * Docs: https://help.octo.uz
 */
const API = "https://secure.octo.uz";

const notifySchema = z.object({
  shop_transaction_id: z.string().max(60),
  octo_payment_UUID: z.string().max(80),
  status: z.string().max(40),
});

type OctoResponse = { error: number; errMessage?: string; data?: { octo_payment_UUID?: string; status?: string; octo_pay_url?: string; total_sum?: number; refunded_sum?: number } | null };

async function call(path: string, body: Record<string, unknown>): Promise<OctoResponse> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Octo ${path} HTTP ${res.status}`);
  return (await res.json()) as OctoResponse;
}

const creds = () => ({ octo_shop_id: Number(env().OCTO_SHOP_ID), octo_secret: env().OCTO_SECRET });

export function mapOctoStatus(status: string | undefined): ProviderStatus {
  switch (status) {
    case "succeeded":
      return "paid";
    case "created":
    case "waiting_for_capture":
    case "wait_user_action":
      return "pending";
    case "canceled":
    case "cancelled":
      return "canceled";
    case "failed":
      return "failed";
    case "refunded":
      return "refunded";
    default:
      return "unknown";
  }
}

async function remoteStatus(orderId: string): Promise<{ status: ProviderStatus; uuid?: string; totalSum?: number }> {
  const r = await call("/prepare_payment", { ...creds(), shop_transaction_id: orderId });
  if (r.error !== 0) return { status: "unknown" };
  return { status: mapOctoStatus(r.data?.status), uuid: r.data?.octo_payment_UUID, totalSum: r.data?.total_sum };
}

/** Apply Octo's (re-checked) status to an order. Exported for tests. */
export async function applyOctoStatus(order: { id: string; amount: number; currency: string }, s: { status: ProviderStatus; uuid?: string; totalSum?: number }) {
  if (s.status === "paid") {
    if (s.totalSum !== undefined && Math.abs(s.totalSum - fromMinor(order.amount, order.currency as Currency)) > 0.005) {
      console.error(`[octo] amount mismatch for order ${order.id}`);
      return;
    }
    await markPaid(order.id, { providerRef: s.uuid });
  } else if (s.status === "canceled" || s.status === "failed") {
    await markCanceled(order.id, `octo ${s.status}`, s.status === "failed" ? "FAILED" : "CANCELED");
  } else if (s.status === "refunded") {
    await markRefunded(order.id);
  }
}

export const octoProvider: PaymentProvider = {
  id: "octo",
  currencies: ["USD"],
  configured: () => !!(env().OCTO_SHOP_ID && env().OCTO_SECRET),
  sandbox: () => env().OCTO_TEST,
  async createCheckout(order, urls) {
    const r = await call("/prepare_payment", {
      ...creds(),
      shop_transaction_id: order.id,
      auto_capture: true,
      test: env().OCTO_TEST,
      init_time: tashkentTime(),
      total_sum: fromMinor(order.amount, order.currency),
      currency: order.currency,
      description: `SAT preparation — order ${order.number}`,
      return_url: urls.returnUrl,
      notify_url: urls.notifyUrl,
      language: order.locale === "uz" ? "uz" : order.locale === "ru" ? "ru" : "en",
      ...(order.user.email ? { user_data: { user_id: order.user.id, email: order.user.email, phone: "" } } : {}),
    });
    if (r.error !== 0 || !r.data?.octo_pay_url) throw new Error(`Octo prepare_payment failed: ${r.errMessage ?? r.error}`);
    await markPending(order.id, r.data.octo_payment_UUID);
    return { redirectUrl: r.data.octo_pay_url, providerRef: r.data.octo_payment_UUID };
  },
  async handleWebhook(req) {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: "BAD_REQUEST" }, 400);
    }
    const parsed = notifySchema.safeParse(body);
    if (!parsed.success) return json({ error: "BAD_REQUEST" }, 400);
    const n = parsed.data;
    const order = await db.order.findUnique({ where: { id: n.shop_transaction_id } });
    if (!order || order.provider !== "octo") return json({ error: "ORDER_NOT_FOUND" }, 404);
    await recordEvent("octo", `${n.octo_payment_UUID}:${n.status}`, n.status, order.id, body);
    await applyOctoStatus(order, await remoteStatus(order.id));
    return json({ status: "ok" });
  },
  async refund(order) {
    if (!order.providerRef) return "manual";
    const r = await call("/refund", {
      ...creds(),
      shop_refund_id: `${order.id}-refund`,
      octo_payment_UUID: order.providerRef,
      amount: fromMinor(order.amount, order.currency),
    });
    if (r.error !== 0) throw new Error(`Octo refund failed: ${r.errMessage ?? r.error}`);
    return r.data?.status === "succeeded" ? "refunded" : "pending";
  },
  async fetchStatus(order) {
    return (await remoteStatus(order.id)).status;
  },
};
