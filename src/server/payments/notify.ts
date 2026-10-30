import "server-only";
import { createTranslator, type Messages } from "next-intl";
import siteConfig from "@site";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { fromMinor, type Currency } from "@/config/plans";
import { loadMessages } from "@/i18n/messages";
import { isEnabledLocale, type AppLocale } from "@/i18n/locales";
import { sendMail } from "@/server/mail";
import { receiptEmail } from "@/server/mail/templates";
import { notify } from "@/server/notify";
import { sendTelegram } from "@/server/telegram-bot";

export function formatMoney(minor: number, currency: Currency, locale: string): string {
  return new Intl.NumberFormat(locale === "uz" ? "uz-UZ" : locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "UZS" ? 0 : 2,
  }).format(fromMinor(minor, currency));
}

async function t(locale: string) {
  const loc: AppLocale = isEnabledLocale(locale) ? locale : "en";
  const messages = (await loadMessages(loc)) as Messages;
  return { loc, t: createTranslator({ locale: loc, messages, namespace: "billing" }) };
}

const siteUrl = () => env().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

/** Email (and Telegram) receipt for a paid order. */
export async function sendReceipt(orderId: string) {
  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { user: { select: { email: true, telegramId: true, locale: true } }, subscription: true },
  });
  const { loc, t: tr } = await t(order.locale ?? order.user.locale ?? "en");
  const date = (d: Date) => new Intl.DateTimeFormat(loc, { dateStyle: "long", timeZone: siteConfig.defaultTimeZone }).format(d);
  const currency = order.currency as Currency;
  const lines: [string, string][] = [
    [tr("receipt.number"), String(order.number)],
    [tr("receipt.plan"), tr(`plans.${order.planId as "monthly"}.name`)],
    [tr("receipt.amount"), formatMoney(order.amount, currency, loc)],
    ...(order.discountAmount ? ([[tr("receipt.discount"), formatMoney(order.discountAmount, currency, loc)]] as [string, string][]) : []),
    [tr("receipt.paidAt"), date(order.paidAt ?? new Date())],
    ...(order.subscription ? ([[tr("receipt.validUntil"), date(order.subscription.endsAt)]] as [string, string][]) : []),
  ];
  const url = `${siteUrl()}/${loc}/billing/receipts/${order.id}`;
  if (order.user.email) await sendMail(await receiptEmail(order.user.email, loc, { number: order.number, lines, url }));
  if (order.user.telegramId) await sendTelegram(order.user.telegramId, `${tr("telegram.paid", { name: siteConfig.name })}\n${lines.map(([k, v]) => `${k}: ${v}`).join("\n")}`);
}

/** "Your premium ends in N days" by email and Telegram (as the student allows). */
export async function sendRenewalReminder(
  user: { id: string; email: string | null; telegramId: string | null; locale: string | null; notificationPrefs: unknown },
  days: number,
  endsAt: Date,
  key: string,
) {
  const loc = user.locale ?? "en";
  const endsOn = new Intl.DateTimeFormat(loc, { dateStyle: "long", timeZone: siteConfig.defaultTimeZone }).format(endsAt);
  await notify(user, "renewals", key, (t) => ({
    subject: t("renewal.subject", { name: siteConfig.name, days }),
    body: t("renewal.body", { days, date: endsOn }),
    path: "/billing",
    cta: t("renewal.cta"),
  }));
}
