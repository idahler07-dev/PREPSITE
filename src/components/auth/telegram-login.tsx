"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInWithTelegram } from "@/server/actions/login";
import { rememberMethod } from "./last-method";

declare global {
  interface Window {
    Telegram?: { Login?: { auth: (options: { bot_id: string; request_access?: "write"; lang?: string }, callback: (user: Record<string, unknown> | false) => void) => void } };
  }
}

const WIDGET_SRC = "https://telegram.org/js/telegram-widget.js?22";

/**
 * "Continue with Telegram": opens Telegram's official login popup (from the
 * Login Widget script) and verifies the signed result on the server. The bot's
 * domain must be set with @BotFather (/setdomain).
 */
export function TelegramLoginButton({ botId, next, onError }: { botId: string; next?: string; onError: (code: string | null) => void }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (window.Telegram?.Login) return setReady(true);
    let script = document.querySelector<HTMLScriptElement>(`script[src="${WIDGET_SRC}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = WIDGET_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
    const onLoad = () => setReady(true);
    script.addEventListener("load", onLoad);
    return () => script.removeEventListener("load", onLoad);
  }, []);

  function open() {
    onError(null);
    rememberMethod("telegram");
    // Called straight from the click so browsers allow the popup.
    window.Telegram?.Login?.auth({ bot_id: botId, request_access: "write", lang: locale }, async (user) => {
      if (!user) return; // popup closed
      setBusy(true);
      const res = await signInWithTelegram(JSON.stringify(user), next);
      if (res.redirectTo) return window.location.assign(res.redirectTo);
      setBusy(false);
      onError(res.error === "RateLimited" ? "RateLimited" : "CredentialsSignin");
    });
  }

  return (
    <Button type="button" variant="outline" size="lg" className="w-full" disabled={!ready || busy} onClick={open}>
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
