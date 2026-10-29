import "server-only";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { billing } from "@/config/plans";
import { markCanceled, markPaid, markPending, markRefunded, recordEvent } from "../orders";
import type { PaymentProvider } from "../types";
import { json, safeEqual } from "../util";

/**
 * Payme (Paycom) Merchant API. Payme calls our endpoint with JSON-RPC
 * (CheckPerformTransaction, CreateTransaction, PerformTransaction,
 * CancelTransaction, CheckTransaction, GetStatement), authenticated with
 * Basic auth "Paycom:<cabinet key>". Amounts are in tiyin. The account field
 * is `order_id` (our order number) — set the same name in the Payme cabinet.
 * Docs: https://developer.help.paycom.uz
 */

const TIMEOUT_MS = 43_200_000; // 12 hours: an unperformed transaction is cancelled with reason 4
const ACCOUNT_FIELD = "order_id";

// Transaction states
const CREATED = 1;
const PERFORMED = 2;
const CANCELED = -1;
const CANCELED_AFTER_PERFORM = -2;

type Msg = { ru: string; uz: string; en: string };
const msg = (en: string, ru: string, uz: string): Msg => ({ en, ru, uz });

class RpcError extends Error {
  constructor(
    public code: number,
    public text: Msg,
    public data?: string,
  ) {
    super(text.en);
  }
}

const ERR = {
  auth: () => new RpcError(-32504, msg("Insufficient privileges", "Недостаточно привилегий", "Ruxsat yetarli emas")),
  parse: () => new RpcError(-32700, msg("Parse error", "Ошибка разбора JSON", "JSON xatosi")),
  method: () => new RpcError(-32601, msg("Method not found", "Метод не найден", "Metod topilmadi")),
  amount: () => new RpcError(-31001, msg("Incorrect amount", "Неверная сумма", "Notoʻgʻri summa")),
  notFound: () => new RpcError(-31003, msg("Transaction not found", "Транзакция не найдена", "Tranzaksiya topilmadi")),
  cannot: () => new RpcError(-31008, msg("Cannot perform the operation", "Невозможно выполнить операцию", "Amalni bajarib boʻlmaydi")),
  cannotCancel: () => new RpcError(-31007, msg("The order is complete and cannot be cancelled", "Заказ выполнен, отмена невозможна", "Buyurtma bajarilgan, bekor qilib boʻlmaydi")),
  order: () => new RpcError(-31050, msg("Order not found", "Заказ не найден", "Buyurtma topilmadi"), ACCOUNT_FIELD),
  orderState: () => new RpcError(-31051, msg("The order cannot be paid (already paid or cancelled)", "Заказ нельзя оплатить (уже оплачен или отменён)", "Buyurtmani toʻlab boʻlmaydi"), ACCOUNT_FIELD),
  orderBusy: () => new RpcError(-31052, msg("The order is waiting for another payment", "Заказ ожидает другую оплату", "Buyurtma boshqa toʻlovni kutmoqda"), ACCOUNT_FIELD),
};

/** Basic auth check: "Paycom:<key>". */
export function paymeAuthorized(header: string | null, key: string | undefined): boolean {
  if (!header || !key) return false;
  const m = /^Basic\s+(.+)$/i.exec(header.trim());
  if (!m) return false;
  const decoded = Buffer.from(m[1]!, "base64").toString("utf8");
  return safeEqual(decoded, `Paycom:${key}`);
}

/** Payme checkout link: base64 of "m=…;ac.order_id=…;a=…;c=…;l=…". */
export function paymeCheckoutUrl(opts: { merchantId: string; orderNumber: number; amount: number; returnUrl: string; lang: string; sandbox: boolean }): string {
  const params = [`m=${opts.merchantId}`, `ac.${ACCOUNT_FIELD}=${opts.orderNumber}`, `a=${opts.amount}`, `c=${opts.returnUrl}`, `l=${["ru", "uz", "en"].includes(opts.lang) ? opts.lang : "ru"}`].join(";");
  const host = opts.sandbox ? "https://checkout.test.paycom.uz" : "https://checkout.paycom.uz";
  return `${host}/${Buffer.from(params).toString("base64")}`;
}

async function orderFromAccount(account: unknown) {
  const raw = (account as Record<string, unknown> | undefined)?.[ACCOUNT_FIELD];
  const number = Number(raw);
  if (!Number.isInteger(number)) throw ERR.order();
  const order = await db.order.findUnique({ where: { number } });
  if (!order || order.provider !== "payme" || order.currency !== "UZS") throw ERR.order();
  return order;
}

async function checkOrderPayable(account: unknown, amount: unknown) {
  const order = await orderFromAccount(account);
  if (order.status !== "CREATED" && order.status !== "PENDING") throw ERR.orderState();
  if (typeof amount !== "number" || amount !== order.amount) throw ERR.amount();
  return order;
}

const ms = (d: Date | null | undefined) => (d ? d.getTime() : 0);

function txnView(t: { id: string; state: number; reason: number | null; createdAt: Date; performedAt: Date | null; canceledAt: Date | null; providerTime: Date | null }) {
  return { create_time: ms(t.createdAt), perform_time: ms(t.performedAt), cancel_time: ms(t.canceledAt), transaction: t.id, state: t.state, reason: t.reason };
}

async function cancelTxn(id: string, orderId: string, state: number, reason: number) {
  const t = await db.paymentTransaction.update({ where: { id }, data: { state, reason, canceledAt: new Date() } });
  if (state === CANCELED) await markCanceled(orderId, `payme cancel reason ${reason}`);
  else await markRefunded(orderId);
  return t;
}

function fiscalDetail(amount: number) {
  const f = billing.fiscal;
  if (!f.ikpu) return undefined; // TODO: set billing.fiscal.ikpu (MXIK) before going live; Payme requires fiscal data for receipts.
  return { receipt_type: 0, items: [{ title: "SAT preparation subscription", price: amount, count: 1, code: f.ikpu, package_code: f.packageCode, vat_percent: f.vatPercent }] };
}

async function handle(method: string, params: Record<string, unknown>): Promise<unknown> {
  switch (method) {
    case "CheckPerformTransaction": {
      const order = await checkOrderPayable(params.account, params.amount);
      const busy = await db.paymentTransaction.count({ where: { provider: "payme", orderId: order.id, state: CREATED } });
      if (busy) throw ERR.orderBusy();
      const detail = fiscalDetail(order.amount);
      return detail ? { allow: true, detail } : { allow: true };
    }
    case "CreateTransaction": {
      const externalId = String(params.id ?? "");
      const existing = await db.paymentTransaction.findUnique({ where: { provider_externalId: { provider: "payme", externalId } } });
      if (existing) {
        if (existing.state !== CREATED) throw ERR.cannot();
        if (Date.now() - ms(existing.providerTime) > TIMEOUT_MS) {
          await cancelTxn(existing.id, existing.orderId, CANCELED, 4);
          throw ERR.cannot();
        }
        return { create_time: ms(existing.createdAt), transaction: existing.id, state: existing.state };
      }
      const order = await checkOrderPayable(params.account, params.amount);
      const busy = await db.paymentTransaction.count({ where: { provider: "payme", orderId: order.id, state: CREATED } });
      if (busy) throw ERR.orderBusy();
      const t = await db.paymentTransaction.create({
        data: { provider: "payme", externalId, orderId: order.id, amount: order.amount, state: CREATED, providerTime: new Date(Number(params.time) || Date.now()) },
      });
      await markPending(order.id, externalId);
      return { create_time: ms(t.createdAt), transaction: t.id, state: t.state };
    }
    case "PerformTransaction": {
      const t = await db.paymentTransaction.findUnique({ where: { provider_externalId: { provider: "payme", externalId: String(params.id ?? "") } } });
      if (!t) throw ERR.notFound();
      if (t.state === PERFORMED) return { transaction: t.id, perform_time: ms(t.performedAt), state: t.state };
      if (t.state !== CREATED) throw ERR.cannot();
      if (Date.now() - ms(t.providerTime) > TIMEOUT_MS) {
        await cancelTxn(t.id, t.orderId, CANCELED, 4);
        throw ERR.cannot();
      }
      const done = await db.paymentTransaction.update({ where: { id: t.id }, data: { state: PERFORMED, performedAt: new Date() } });
      await markPaid(t.orderId, { providerRef: t.externalId });
      return { transaction: done.id, perform_time: ms(done.performedAt), state: done.state };
    }
    case "CancelTransaction": {
      const t = await db.paymentTransaction.findUnique({ where: { provider_externalId: { provider: "payme", externalId: String(params.id ?? "") } } });
      if (!t) throw ERR.notFound();
      const reason = Number(params.reason) || 0;
      if (t.state === CANCELED || t.state === CANCELED_AFTER_PERFORM) return { transaction: t.id, cancel_time: ms(t.canceledAt), state: t.state };
      const c = await cancelTxn(t.id, t.orderId, t.state === PERFORMED ? CANCELED_AFTER_PERFORM : CANCELED, reason);
      return { transaction: c.id, cancel_time: ms(c.canceledAt), state: c.state };
    }
    case "CheckTransaction": {
      const t = await db.paymentTransaction.findUnique({ where: { provider_externalId: { provider: "payme", externalId: String(params.id ?? "") } } });
      if (!t) throw ERR.notFound();
      return txnView(t);
    }
    case "GetStatement": {
      const from = new Date(Number(params.from) || 0);
      const to = new Date(Number(params.to) || 0);
      const list = await db.paymentTransaction.findMany({
        where: { provider: "payme", providerTime: { gte: from, lte: to } },
        orderBy: { providerTime: "asc" },
        include: { order: { select: { number: true } } },
      });
      return {
        transactions: list.map((t) => ({
          id: t.externalId,
          time: ms(t.providerTime),
          amount: t.amount,
          account: { [ACCOUNT_FIELD]: String(t.order.number) },
          ...txnView(t),
          receivers: null,
        })),
      };
    }
    default:
      throw ERR.method();
  }
}

/** One JSON-RPC request from Payme → JSON-RPC response (always HTTP 200, as Payme expects). */
export async function processPaymeRequest(body: string, authHeader: string | null, key: string | undefined): Promise<unknown> {
  let req: { id?: unknown; method?: unknown; params?: unknown };
  try {
    req = JSON.parse(body);
  } catch {
    const e = ERR.parse();
    return { error: { code: e.code, message: e.text }, id: null };
  }
  const id = req.id ?? null;
  try {
    if (!paymeAuthorized(authHeader, key)) throw ERR.auth();
    const params = (req.params ?? {}) as Record<string, unknown>;
    const method = String(req.method ?? "");
    await recordEvent("payme", `${method}:${String(params.id ?? "")}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`, method, null, req).catch(() => {});
    return { result: await handle(method, params), id };
  } catch (e) {
    if (e instanceof RpcError) return { error: { code: e.code, message: e.text, ...(e.data ? { data: e.data } : {}) }, id };
    console.error("[payme]", e);
    return { error: { code: -32400, message: msg("System error", "Системная ошибка", "Tizim xatosi") }, id };
  }
}

export const paymeProvider: PaymentProvider = {
  id: "payme",
  currencies: ["UZS"],
  configured: () => !!(env().PAYME_MERCHANT_ID && env().PAYME_KEY),
  sandbox: () => env().PAYME_SANDBOX,
  async createCheckout(order, urls) {
    return {
      redirectUrl: paymeCheckoutUrl({
        merchantId: env().PAYME_MERCHANT_ID!,
        orderNumber: order.number,
        amount: order.amount,
        returnUrl: urls.returnUrl,
        lang: order.locale,
        sandbox: env().PAYME_SANDBOX,
      }),
    };
  },
  async handleWebhook(req) {
    return json(await processPaymeRequest(await req.text(), req.headers.get("authorization"), env().PAYME_KEY));
  },
  // Payme refunds are made in the Payme business cabinet; Payme then calls CancelTransaction and the order becomes REFUNDED.
  async refund() {
    return "manual";
  },
};
