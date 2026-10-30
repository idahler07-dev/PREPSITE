"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ExternalLink, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestMagicLink, signInWithGoogle, verifyEmailCode, type CodeState, type LoginState } from "@/server/actions/login";
import { TelegramLoginButton } from "./telegram-login";
import { rememberMethod, useLastMethod } from "./last-method";

type AuthErrorKey = keyof IntlMessages["auth"]["errors"];
type IntlMessages = import("next-intl").Messages;

const KNOWN_ERRORS = ["EmailSignin", "OAuthAccountNotLinked", "Verification", "AccessDenied", "CredentialsSignin", "Configuration", "RateLimited", "InvalidEmail", "WrongCode"];
const RESEND_AFTER_SEC = 60;

/** Webmail for common providers, so people can jump straight to the code. */
const MAIL_APPS: { app: string; url: string; domains: string[] }[] = [
  { app: "Gmail", url: "https://mail.google.com/mail/u/0/#inbox", domains: ["gmail.com", "googlemail.com"] },
  { app: "Outlook", url: "https://outlook.live.com/mail/0/", domains: ["outlook.com", "hotmail.com", "live.com", "msn.com"] },
  { app: "Yandex Mail", url: "https://mail.yandex.ru/", domains: ["yandex.ru", "yandex.com", "ya.ru", "yandex.uz"] },
  { app: "Mail.ru", url: "https://e.mail.ru/inbox/", domains: ["mail.ru", "inbox.ru", "list.ru", "bk.ru"] },
  { app: "iCloud Mail", url: "https://www.icloud.com/mail", domains: ["icloud.com", "me.com", "mac.com"] },
];

function LastUsed({ show }: { show: boolean }) {
  const t = useTranslations("auth");
  if (!show) return null;
  return <span className="absolute -top-2 end-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">{t("lastUsed")}</span>;
}

export function LoginForm({
  next,
  initialError,
  google,
  telegramBotId,
  emailNote,
}: {
  next?: string;
  initialError?: string;
  google: boolean;
  telegramBotId?: string;
  /** Shown under the email field (e.g. on the demo site, where emails aren't delivered). */
  emailNote?: string;
}) {
  const t = useTranslations("auth");
  const last = useLastMethod();
  const [state, action, pending] = useActionState<LoginState, FormData>(requestMagicLink, {});
  // The code step opens for the email the last request succeeded for; "Change email" closes it.
  const [codeFor, setCodeFor] = useState<string | null>(null);
  const [telegramError, setTelegramError] = useState<string | null>(null);

  useEffect(() => {
    if (state.email && !state.error) setCodeFor(state.email);
  }, [state]);

  const errorKey = (telegramError ?? state.error ?? initialError) as AuthErrorKey | undefined;
  const error = errorKey ? t(`errors.${KNOWN_ERRORS.includes(errorKey) ? errorKey : "Default"}` as `errors.${AuthErrorKey}`) : null;

  if (codeFor) {
    return <CodeStep email={codeFor} next={next} onBack={() => setCodeFor(null)} resend={action} resending={pending} resendError={state.error} />;
  }

  return (
    <div className="space-y-5">
      {error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-danger-muted p-3 text-sm">
          {error}
        </p>
      )}

      {(google || telegramBotId) && (
        <>
          <div className="space-y-3">
            {google && (
              <form action={signInWithGoogle} onSubmit={() => rememberMethod("google")} className="relative">
                <input type="hidden" name="next" value={next ?? ""} />
                <Button type="submit" variant="outline" size="lg" className="w-full">
                  <GoogleIcon />
                  {t("google")}
                </Button>
                <LastUsed show={last === "google"} />
              </form>
            )}
            {telegramBotId && (
              <div className="relative">
                <TelegramLoginButton botId={telegramBotId} next={next} onError={setTelegramError} />
                <LastUsed show={last === "telegram"} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground uppercase">
            <span className="h-px flex-1 bg-border" />
            {t("or")}
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form action={action} onSubmit={() => rememberMethod("email")} className="space-y-3">
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
            className="h-11"
            placeholder={t("emailPlaceholder")}
            defaultValue={state.email}
            aria-describedby={emailNote ? "email-note" : undefined}
          />
        </div>
        <div className="relative">
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Mail aria-hidden />}
            {pending ? t("sending") : t("sendCode")}
          </Button>
          <LastUsed show={last === "email"} />
        </div>
        {emailNote && (
          <p id="email-note" className="text-xs text-muted-foreground">
            {emailNote}
          </p>
        )}
      </form>
    </div>
  );
}

function CodeStep({
  email,
  next,
  onBack,
  resend,
  resending,
  resendError,
}: {
  email: string;
  next?: string;
  onBack: () => void;
  resend: (form: FormData) => void;
  resending: boolean;
  resendError?: string;
}) {
  const t = useTranslations("auth");
  const [state, verify, verifying] = useActionState<CodeState, FormData>(verifyEmailCode, {});
  const [code, setCode] = useState("");
  const [wait, setWait] = useState(RESEND_AFTER_SEC);
  const [resent, setResent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = verifying || !!state.redirectTo;
  const mailApp = MAIL_APPS.find((m) => m.domains.includes(email.split("@")[1] ?? ""));

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  // A right code: open the sign-in URL (a full page load, so it's requested once).
  // A wrong code clears the field so the next attempt starts fresh.
  useEffect(() => {
    if (state.redirectTo) window.location.assign(state.redirectTo);
    else if (state.error) {
      setCode("");
      inputRef.current?.focus();
    }
  }, [state]);

  function onChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    // Submit as soon as the sixth digit arrives (typed, pasted or autofilled).
    if (digits.length === 6 && !busy) queueMicrotask(() => formRef.current?.requestSubmit());
  }

  function onResend() {
    const form = new FormData();
    form.set("email", email);
    form.set("next", next ?? "");
    startTransition(() => resend(form));
    setWait(RESEND_AFTER_SEC);
    setResent(true);
  }

  const error = state.error
    ? t(`errors.${state.error === "RateLimited" ? "RateLimited" : "WrongCode"}`)
    : resent && resendError
      ? t(`errors.${resendError === "RateLimited" ? "RateLimited" : "EmailSignin"}`)
      : null;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{t("codeTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t.rich("codeSent", { email, b: (chunks) => <strong className="font-medium text-foreground break-all">{chunks}</strong> })}
        </p>
      </div>

      <form ref={formRef} action={verify} className="space-y-3">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next ?? ""} />
        <Label htmlFor="code">{t("codeLabel")}</Label>
        <Input
          ref={inputRef}
          id="code"
          name="code"
          value={code}
          onChange={(e) => onChange(e.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          autoFocus
          aria-invalid={!!error}
          aria-describedby={error ? "code-error" : "code-hint"}
          className="h-14 text-center font-mono text-2xl tracking-[0.5em]"
        />
        {error && (
          <p id="code-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={busy || code.length !== 6}>
          {busy && <Loader2 className="animate-spin" aria-hidden />}
          {busy ? t("verifying") : t("verify")}
        </Button>
      </form>

      <p id="code-hint" className="text-xs text-muted-foreground">
        {t("codeHint")}
      </p>

      {mailApp && (
        <Button asChild variant="outline" className="w-full">
          <a href={mailApp.url} target="_blank" rel="noopener noreferrer">
            {t("openMail", { app: mailApp.app })}
            <ExternalLink aria-hidden />
          </a>
        </Button>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Button type="button" variant="link" className="h-auto px-0" onClick={onBack}>
          <ArrowLeft aria-hidden />
          {t("changeEmail")}
        </Button>
        <Button type="button" variant="link" className="h-auto px-0" disabled={wait > 0 || resending} onClick={onResend}>
          {wait > 0 ? t("resendIn", { seconds: wait }) : t("resend")}
        </Button>
      </div>
      <p aria-live="polite" className="sr-only">
        {resent && !resending ? t("resent") : ""}
      </p>
      <p className="text-xs text-muted-foreground">{t("checkEmailSpam")}</p>
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
