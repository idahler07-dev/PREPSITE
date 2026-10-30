"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInWithTelegram } from "@/server/actions/login";
import { rememberMethod } from "./last-method";

const TELEGRAM_ORIGIN = "https://oauth.telegram.org";
const RESULT_IN_HASH = /[#?&]tgAuthResult=([A-Za-z0-9\-_=]*)$/;
const NEXT_KEY = "auth:telegram-next";

/** Telegram returns the signed login data as base64url JSON in `#tgAuthResult=`. */
function readHashResult(): Record<string, unknown> | null {
  const match = RESULT_IN_HASH.exec(window.location.hash);
  if (!match) return null;
  history.replaceState(null, "", window.location.pathname + window.location.search);
  try {
    const b64 = (match[1] ?? "").replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, "="))) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * "Continue with Telegram" via Telegram's login page (oauth.telegram.org).
 * Desktop: a popup that posts the result back. Where popups are blocked
 * (phones, Telegram's in-app browser) the page goes there itself and Telegram
 * sends the result back in the URL hash. Either way the server checks
 * Telegram's signature. The bot's domain must be set with @BotFather (/setdomain).
 */
export function TelegramLoginButton({ botId, next, onError }: { botId: string; next?: string; onError: (code: string | null) => void }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const popup = useRef<Window | null>(null);

  async function finish(user: Record<string, unknown>, nextPath?: string) {
    setBusy(true);
    const res = await signInWithTelegram(JSON.stringify(user), nextPath);
    if (res.redirectTo) return window.location.assign(res.redirectTo);
    setBusy(false);
    onError(res.error === "RateLimited" ? "RateLimited" : "CredentialsSignin");
  }

  // Back from Telegram's page after a full-page sign-in.
  useEffect(() => {
    const user = readHashResult();
    if (!user) return;
    let saved: string | undefined;
    try {
      saved = sessionStorage.getItem(NEXT_KEY) ?? undefined;
      sessionStorage.removeItem(NEXT_KEY);
    } catch {}
    void finish(user, saved || next);
    // Runs once on load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Result posted by the popup.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== TELEGRAM_ORIGIN || !popup.current || e.source !== popup.current) return;
      let data: { event?: string; result?: Record<string, unknown> } = {};
      try {
        data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {}
      if (data.event !== "auth_result") return;
      popup.current = null;
      if (data.result) void finish(data.result, next);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // finish only reads props that are fixed for this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [next]);

  function open() {
    onError(null);
    rememberMethod("telegram");
    const params = new URLSearchParams({
      bot_id: botId,
      origin: window.location.origin,
      request_access: "write",
      lang: locale,
      return_to: window.location.origin + window.location.pathname,
    });
    const url = `${TELEGRAM_ORIGIN}/auth?${params}`;
    const w = 550;
    const h = 470;
    const left = Math.max(0, (screen.width - w) / 2);
    const top = Math.max(0, (screen.height - h) / 2);
    popup.current = window.open(url, "telegram_oauth", `width=${w},height=${h},left=${left},top=${top}`);
    if (!popup.current) {
      // Popup blocked: sign in on Telegram's page in this tab instead.
      try {
        sessionStorage.setItem(NEXT_KEY, next ?? "");
      } catch {}
      window.location.assign(url);
    }
  }

  return (
    <Button type="button" variant="outline" size="lg" className="w-full" disabled={busy} onClick={open}>
      {busy ? <Loader2 className="animate-spin" aria-hidden /> : <TelegramIcon />}
      {t("telegram")}
    </Button>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#229ED9" />
      <path fill="#fff" d="M5.4 11.8 16.9 7.4c.5-.2 1 .1.8.9l-2 9.3c-.1.6-.5.8-1 .5l-3-2.2-1.4 1.4c-.2.2-.3.3-.6.3l.2-3.1 5.6-5.1c.2-.2 0-.3-.4-.1l-6.9 4.4-3-.9c-.6-.2-.6-.6.2-.9z" />
    </svg>
  );
}
