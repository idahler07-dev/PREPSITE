import "server-only";
import { createTranslator, type Messages } from "next-intl";
import siteConfig from "@site";
import { loadMessages } from "@/i18n/messages";
import { isEnabledLocale, type AppLocale } from "@/i18n/locales";
import { escapeHtml, type MailMessage } from "./index";

function layout(body: string, footer: string) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f5f6f8;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1d2230">
<table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px">
<tr><td style="font-size:20px;font-weight:700;padding-bottom:16px">${escapeHtml(siteConfig.name)}</td></tr>
<tr><td style="font-size:15px;line-height:1.6">${body}</td></tr>
<tr><td style="font-size:12px;color:#5b6170;padding-top:24px;border-top:1px solid #e6e8ee">${footer}</td></tr>
</table></body></html>`;
}

export async function magicLinkEmail(to: string, url: string, locale: string): Promise<MailMessage> {
  const loc: AppLocale = isEnabledLocale(locale) ? locale : "en";
  const messages = (await loadMessages(loc)) as Messages;
  const t = createTranslator({ locale: loc, messages, namespace: "email.magicLink" });
  const name = siteConfig.name;
  const button = `<a href="${escapeHtml(url)}" style="display:inline-block;background:#2a4fb0;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">${escapeHtml(t("button"))}</a>`;
  const html = layout(
    `<p>${escapeHtml(t("intro", { name }))}</p><p style="margin:24px 0">${button}</p><p style="color:#5b6170;font-size:13px">${escapeHtml(t("expires"))}</p><p style="color:#5b6170;font-size:13px;word-break:break-all">${escapeHtml(url)}</p>`,
    escapeHtml(t("ignore")),
  );
  const text = `${t("intro", { name })}\n\n${url}\n\n${t("expires")}\n${t("ignore")}`;
  return { to, subject: t("subject", { name }), html, text };
}
