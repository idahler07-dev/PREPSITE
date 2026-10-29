"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Mail } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestMagicLink, signInWithGoogle, type LoginState } from "@/server/actions/login";
import { TelegramLoginButton } from "./telegram-login";

type AuthErrorKey = keyof IntlMessages["auth"]["errors"];
type IntlMessages = import("next-intl").Messages;

export function LoginForm({
  next,
  initialError,
  google,
  telegramBot,
}: {
  next?: string;
  initialError?: string;
  google: boolean;
  telegramBot?: string;
}) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [state, action, pending] = useActionState<LoginState, FormData>(requestMagicLink, {});

  useEffect(() => {
    if (state.email && !state.error) router.push("/login/check-email");
  }, [state, router]);

  const errorKey = (state.error ?? initialError) as AuthErrorKey | undefined;
  const knownErrors = ["EmailSignin", "OAuthAccountNotLinked", "Verification", "AccessDenied", "CredentialsSignin", "Configuration", "RateLimited", "InvalidEmail"];
  const error = errorKey ? t(`errors.${knownErrors.includes(errorKey) ? errorKey : "Default"}` as `errors.${AuthErrorKey}`) : null;

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-danger-muted p-3 text-sm">
          {error}
        </p>
      )}
      <form action={action} className="space-y-3">
        <input type="hidden" name="next" value={next ?? ""} />
        <div className="space-y-2">
          <Label htmlFor="email">{t("emailLabel")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder={t("emailPlaceholder")}
            defaultValue={state.email}
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Mail aria-hidden />}
          {pending ? t("sending") : t("sendLink")}
        </Button>
      </form>

      {(google || telegramBot) && (
        <>
          <div className="flex items-center gap-3 text-xs text-muted-foreground uppercase">
            <span className="h-px flex-1 bg-border" />
            {t("orContinueWith")}
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="space-y-3">
            {google && (
              <form action={signInWithGoogle}>
                <input type="hidden" name="next" value={next ?? ""} />
                <Button type="submit" variant="outline" className="w-full">
                  <GoogleIcon />
                  {t("google")}
                </Button>
              </form>
            )}
            {telegramBot && <TelegramLoginButton bot={telegramBot} next={next} />}
          </div>
        </>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
    </svg>
  );
}
