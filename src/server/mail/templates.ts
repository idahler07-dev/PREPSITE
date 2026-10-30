import "server-only";
import { createTranslator, type Messages } from "next-intl";
import siteConfig from "@site";
import { loadMessages } from "@/i18n/messages";
import { isEnabledLocale, type AppLocale } from "@/i18n/locales";
import { escapeHtml, type MailMessage } from "./index";

/** Brand colors for email (mail apps don't support CSS variables); same values as the light theme. */
const MAIL = { bg: "#F7F5F0", surface: "#FFFFFF", text: "#13202E", muted: "#5B6676", border: "#E2DDD2", button: "#0A7373" };

function layout(body: string, footer: string) {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  return `<!doctype html><html><body style="margin:0;padding:24px;background:${MAIL.bg};font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:${MAIL.text}">
<table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:${MAIL.surface};border:1px solid ${MAIL.border};border-radius:12px;padding:32px">
<tr><td style="padding-bottom:20px"><img src="${escapeHtml(site)}/brand/logo-email.png" alt="${escapeHtml(siteConfig.name)}" height="32" style="height:32px;width:auto;border:0"></td></tr>
<tr><td style="font-size:15px;line-height:1.6">${body}</td></tr>
<tr><td style="font-size:12px;color:${MAIL.muted};padding-top:24px;border-top:1px solid ${MAIL.border}">${footer}</td></tr>
</table></body></html>`;
}

export async function magicLinkEmail(to: string, url: string, code: string, locale: string): Promise<MailMessage> {
  const loc: AppLocale = isEnabledLocale(locale) ? locale : "en";
  const messages = (await loadMessages(loc)) as Messages;
  const t = createTranslator({ locale: loc, messages, namespace: "email.magicLink" });
  const name = siteConfig.name;
  const button = `<a href="${escapeHtml(url)}" style="display:inline-block;background:${MAIL.button};color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">${escapeHtml(t("button"))}</a>`;
  const codeBox = `<p style="margin:16px 0;font-size:32px;font-weight:700;letter-spacing:8px;font-family:ui-monospace,Menlo,Consolas,monospace">${escapeHtml(code)}</p>`;
  const html = layout(
    `<p>${escapeHtml(t("intro", { name }))}</p>${codeBox}<p>${escapeHtml(t("orLink"))}</p><p style="margin:16px 0 24px">${button}</p><p style="color:${MAIL.muted};font-size:13px">${escapeHtml(t("expires"))}</p><p style="color:${MAIL.muted};font-size:13px;word-break:break-all">${escapeHtml(url)}</p>`,
    escapeHtml(t("ignore")),
  );
  const text = `${t("intro", { name })}\n\n${code}\n\n${t("orLink")}\n${url}\n\n${t("expires")}\n${t("ignore")}`;
  return { to, subject: t("subject", { name, code }), html, text };
}

async function translator(locale: string, namespace: string) {
  const loc: AppLocale = isEnabledLocale(locale) ? locale : "en";
  const messages = (await loadMessages(loc)) as Messages;
  return { loc, t: createTranslator({ locale: loc, messages, namespace: namespace as "email" }) as unknown as (key: string, values?: Record<string, string | number>) => string };
}

const button = (url: string, label: string) =>
  `<a href="${escapeHtml(url)}" style="display:inline-block;background:${MAIL.button};color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">${escapeHtml(label)}</a>`;

/** Payment receipt. `lines` are already-formatted label/value pairs. */
export async function receiptEmail(
  to: string,
  locale: string,
  data: { number: number; lines: [string, string][]; url: string },
): Promise<MailMessage> {
  const { t } = await translator(locale, "email.receipt");
  const name = siteConfig.name;
  const rows = data.lines.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:${MAIL.muted}">${escapeHtml(k)}</td><td style="padding:4px 0;font-weight:600">${escapeHtml(v)}</td></tr>`).join("");
  const html = layout(
    `<p>${escapeHtml(t("intro", { name }))}</p><table role="presentation" style="margin:16px 0">${rows}</table><p>${button(data.url, t("button"))}</p>`,
    escapeHtml(t("footer", { legalName: siteConfig.legalName })),
  );
  const text = [t("intro", { name }), "", ...data.lines.map(([k, v]) => `${k}: ${v}`), "", data.url].join("\n");
  return { to, subject: t("subject", { name, number: data.number }), html, text };
}

/** A short notification with one button. */
export async function simpleEmail(to: string, m: { subject: string; body: string; url: string; cta: string; footer: string }): Promise<MailMessage> {
  const html = layout(`<p>${escapeHtml(m.body)}</p><p style="margin:24px 0">${button(m.url, m.cta)}</p>`, escapeHtml(m.footer));
  return { to, subject: m.subject, html, text: `${m.body}\n\n${m.url}\n\n${m.footer}` };
}
