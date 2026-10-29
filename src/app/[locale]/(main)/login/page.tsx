import { getLocale, getTranslations } from "next-intl/server";
import { env } from "@/lib/env";
import { Link, redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { LoginForm } from "@/components/auth/login-form";
import { safeNextPath } from "@/lib/safe-redirect";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("signIn") };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const locale = await getLocale();
  const sp = await searchParams;
  const next = safeNextPath(sp.next) ?? undefined;
  if (await getCurrentUser()) redirect({ href: next ?? "/dashboard", locale });

  const t = await getTranslations("auth");
  const e = env();
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <h1 className="text-2xl font-bold tracking-tight">{t("signInTitle")}</h1>
      <p className="mt-2 mb-8 text-muted-foreground">{t("signInSubtitle")}</p>
      <LoginForm
        next={next}
        initialError={sp.error}
        google={!!(e.AUTH_GOOGLE_ID && e.AUTH_GOOGLE_SECRET)}
        telegramBot={e.TELEGRAM_BOT_TOKEN ? e.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME : undefined}
      />
      <p className="mt-8 text-xs text-muted-foreground">
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
  );
}
