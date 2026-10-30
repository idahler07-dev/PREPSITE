import { getLocale, getTranslations } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import { env } from "@/lib/env";
import { Link, redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { LoginForm } from "@/components/auth/login-form";
import { DemoLogin } from "@/components/auth/demo-login";
import { safeNextPath } from "@/lib/safe-redirect";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("signIn") };
}

const PERKS = ["tests", "explanations", "plan", "progress"] as const;

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const locale = await getLocale();
  const sp = await searchParams;
  const next = safeNextPath(sp.next) ?? undefined;
  if (await getCurrentUser()) redirect({ href: next ?? "/dashboard", locale });

  const t = await getTranslations("auth");
  const e = env();
  // Telegram's login popup takes the bot's numeric id: the part of the token before the colon.
  const telegramBotId = e.TELEGRAM_BOT_TOKEN?.split(":")[0];
  return (
    <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-10 sm:py-16 lg:grid-cols-[1fr_minmax(0,28rem)] lg:gap-16">
      <aside className="hidden lg:block">
        <h2 className="text-3xl font-bold tracking-tight">{t("perks.title")}</h2>
        <ul className="mt-6 space-y-4">
          {PERKS.map((p) => (
            <li key={p} className="flex gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <span className="text-muted-foreground">{t(`perks.${p}`)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-8 inline-flex rounded-full bg-primary-soft px-3 py-1 text-sm font-medium">{t("perks.free")}</p>
      </aside>

      <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">{t("signInTitle")}</h1>
        <p className="mt-2 mb-6 text-sm text-muted-foreground">{t("signInSubtitle")}</p>
        {e.DEMO_MODE && <DemoLogin />}
        <LoginForm
          next={next}
          initialError={sp.error}
          google={!!(e.AUTH_GOOGLE_ID && e.AUTH_GOOGLE_SECRET)}
          telegramBotId={telegramBotId}
          emailNote={e.DEMO_MODE && e.EMAIL_TRANSPORT === "outbox" ? t("demoEmailNote") : undefined}
        />
        <p className="mt-6 text-xs text-muted-foreground">
          {t.rich("termsNote", {
            terms: (chunks) => (
              <Link href="/terms" className="underline">
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link href="/privacy" className="underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </div>
  );
}
