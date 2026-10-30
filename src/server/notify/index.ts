import "server-only";
import { createTranslator, type Messages } from "next-intl";
import siteConfig from "@site";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { resolvePrefs, type NotificationKind } from "@/config/notifications";
import { loadMessages } from "@/i18n/messages";
import { isEnabledLocale, type AppLocale } from "@/i18n/locales";
import { sendMail } from "@/server/mail";
import { simpleEmail } from "@/server/mail/templates";
import { sendTelegram } from "@/server/telegram-bot";

type Recipient = { id: string; email: string | null; telegramId: string | null; locale: string | null; notificationPrefs: unknown };

export async function translatorFor(locale: string | null) {
  const loc: AppLocale = isEnabledLocale(locale) ? locale : "en";
  const messages = (await loadMessages(loc)) as Messages;
  return { loc, t: createTranslator({ locale: loc, messages, namespace: "notifications" }) };
}

/**
 * Send one notification by the channels the student allows, at most once per
 * (kind, key) — e.g. ("study", "2026-11-04"). Returns true if anything was sent.
 */
export async function notify(
  user: Recipient,
  kind: NotificationKind,
  key: string,
  build: (t: Awaited<ReturnType<typeof translatorFor>>["t"]) => { subject: string; body: string; path: string; cta: string },
): Promise<boolean> {
  const prefs = resolvePrefs(user.notificationPrefs);
  const viaEmail = prefs.email[kind] && !!user.email;
  const viaTelegram = prefs.telegram[kind] && !!user.telegramId && !!env().TELEGRAM_BOT_TOKEN;
  if (!viaEmail && !viaTelegram) return false;
  try {
    await db.notificationLog.create({ data: { userId: user.id, kind, key } });
  } catch {
    return false; // already sent
  }
  const { loc, t } = await translatorFor("en");
  const msg = build(t);
  const url = `${env().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/${loc}${msg.path}`;
  const settings = `${env().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/${loc}/settings`;
  if (viaEmail) {
    await sendMail(await simpleEmail(user.email!, { subject: msg.subject, body: msg.body, url, cta: msg.cta, footer: t("footer", { name: siteConfig.name, settings }) })).catch((e) =>
      console.error("[notify] email", e),
    );
  }
  if (viaTelegram) await sendTelegram(user.telegramId!, `${msg.body}\n${url}`);
  return true;
}
