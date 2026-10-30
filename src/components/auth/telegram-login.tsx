"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { signInWithTelegram } from "@/server/actions/login";

declare global {
  interface Window {
    onTelegramAuth?: (user: Record<string, unknown>) => void;
  }
}

/** Official Telegram Login Widget. The bot's domain must be set with @BotFather (/setdomain). */
export function TelegramLoginButton({ bot, next }: { bot: string; next?: string }) {
  const t = useTranslations("auth");
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    window.onTelegramAuth = async (user) => {
      const res = await signInWithTelegram(JSON.stringify(user), next);
      if (res.redirectTo) window.location.assign(res.redirectTo);
      else toast.error(t(`errors.${res.error === "RateLimited" ? "RateLimited" : "CredentialsSignin"}`));
    };
    const el = ref.current;
    if (!el) return;
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", bot);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.onload = () => setLoaded(true);
    el.appendChild(script);
    return () => {
      el.innerHTML = "";
      delete window.onTelegramAuth;
    };
  }, [bot, next, t]);

  return (
    <div className="flex min-h-10 justify-center">
      {!loaded && <span className="text-sm text-muted-foreground">{t("telegramLoading")}</span>}
      <div ref={ref} />
    </div>
  );
}
