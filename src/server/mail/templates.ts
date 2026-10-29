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

async function translator(locale: string, namespace: string) {
  const loc: AppLocale = isEnabledLocale(locale) ? locale : "en";
  const messages = (await loadMessages(loc)) as Messages;
  return { loc, t: createTranslator({ locale: loc, messages, namespace: namespace as "email" }) as unknown as (key: string, values?: Record<string, string | number>) => string };
}

const button = (url: string, label: string) =>
  `<a href="${escapeHtml(url)}" style="display:inline-block;background:#2a4fb0;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">${escapeHtml(label)}</a>`;

/** Payment receipt. `lines` are already-formatted label/value pairs. */
export async function receiptEmail(
  to: string,
  locale: string,
  data: { number: number; lines: [string, string][]; url: string },
): Promise<MailMessage> {
  const { t } = await translator(locale, "email.receipt");
  const name = siteConfig.name;
  const rows = data.lines.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#5b6170">${escapeHtml(k)}</td><td style="padding:4px 0;font-weight:600">${escapeHtml(v)}</td></tr>`).join("");
  const html = layout(
    `<p>${escapeHtml(t("intro", { name }))}</p><table role="presentation" style="margin:16px 0">${rows}</table><p>${button(data.url, t("button"))}</p>`,
    escapeHtml(t("footer", { legalName: siteConfig.legalName })),
  );
  const text = [t("intro", { name }), "", ...data.lines.map(([k, v]) => `${k}: ${v}`), "", data.url].join("\n");
  return { to, subject: t("subject", { name, number: data.number }), html, text };
}

export async function renewalReminderEmail(to: string, locale: string, data: { days: number; endsOn: string; url: string }): Promise<MailMessage> {
  const { t } = await translator(locale, "email.renewal");
  const name = siteConfig.name;
  const body = t("body", { days: data.days, date: data.endsOn });
  const html = layout(`<p>${escapeHtml(body)}</p><p style="margin:24px 0">${button(data.url, t("button"))}</p>`, escapeHtml(t("footer")));
  return { to, subject: t("subject", { name, days: data.days }), html, text: `${body}\n\n${data.url}` };
}
