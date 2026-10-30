import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { env, isProduction } from "@/lib/env";
import { markCanceled, markPaid, markRefunded, recordEvent } from "../orders";
import type { PaymentProvider } from "../types";
import { hmacSha256, json, safeEqual } from "../util";

/**
 * Pretend provider for development and tests. Its "hosted checkout" is our
 * own page /payments/mock/[orderId]; its callbacks are signed with
 * MOCK_PAYMENT_SECRET exactly like a real provider's would be.
 */
const eventSchema = z.object({
  eventId: z.string().min(1).max(80),
  orderId: z.string().max(40),
  status: z.enum(["paid", "failed", "refunded"]),
  amount: z.number().int(),
  currency: z.enum(["UZS", "USD"]),
});
export type MockEvent = z.infer<typeof eventSchema>;

export function signMockEvent(body: string): string {
  return hmacSha256(env().MOCK_PAYMENT_SECRET, body);
}

/** Build a signed callback as the mock provider would send it. */
export function mockCallback(event: Omit<MockEvent, "eventId">): { body: string; signature: string } {
  const body = JSON.stringify({ eventId: randomUUID(), ...event });
  return { body, signature: signMockEvent(body) };
}

export async function processMockEvent(body: string, signature: string | null): Promise<{ status: number; body: unknown }> {
  if (!signature || !safeEqual(signature, signMockEvent(body))) return { status: 401, body: { error: "BAD_SIGNATURE" } };
  let event: MockEvent;
  try {
    event = eventSchema.parse(JSON.parse(body));
  } catch {
    return { status: 400, body: { error: "BAD_REQUEST" } };
  }
  const order = await db.order.findUnique({ where: { id: event.orderId } });
  if (!order || order.provider !== "mock") return { status: 404, body: { error: "ORDER_NOT_FOUND" } };
  if (order.amount !== event.amount || order.currency !== event.currency) return { status: 422, body: { error: "AMOUNT_MISMATCH" } };
  if (!(await recordEvent("mock", event.eventId, event.status, order.id, event))) return { status: 200, body: { ok: true, duplicate: true } };
  if (event.status === "paid") await markPaid(order.id, { providerRef: `mock-${event.eventId}` });
  else if (event.status === "failed") await markCanceled(order.id, "declined at mock checkout", "FAILED");
  else await markRefunded(order.id);
  return { status: 200, body: { ok: true } };
}

export const mockProvider: PaymentProvider = {
  id: "mock",
  currencies: ["UZS", "USD"],
  configured: () => !isProduction() || env().ALLOW_MOCK_PAYMENTS,
  sandbox: () => true,
  async createCheckout(order, urls) {
    const base = urls.returnUrl.split("/payments/")[0]!;
    return { redirectUrl: `${base}/payments/mock/${order.id}` };
  },
  async handleWebhook(req) {
    const body = await req.text();
    const res = await processMockEvent(body, req.headers.get("x-mock-signature"));
    return json(res.body, res.status);
  },
  async refund() {
    return "refunded";
  },
};
