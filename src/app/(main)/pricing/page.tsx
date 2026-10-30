import { getLocale, getTranslations } from "next-intl/server";
import { Check } from "lucide-react";
import { freeLimits, paidPlans, premiumLimits, toMinor, type Currency } from "@/config/plans";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getEntitlement } from "@/server/billing/entitlement";
import { enabledProviders } from "@/server/payments";
import { formatMoney } from "@/server/payments/notify";
import { Container, PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  const t = await getTranslations("billing.pricing");
  return { title: t("title"), description: t("subtitle") };
}

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ currency?: string }> }) {
  const sp = await searchParams;
  const currency: Currency = sp.currency === "USD" ? "USD" : "UZS";
  const t = await getTranslations("billing");
  const locale = await getLocale();
  const user = await getCurrentUser();
  const ent = user ? await getEntitlement(user.id) : null;
  const canPay = enabledProviders(currency).length > 0;

  const premiumFeatures = [
    t("features.questionsUnlimited"),
    t("features.testsUnlimited"),
    t("features.ai", { count: premiumLimits.aiAnswersPerDay }),
    t("features.tools"),
    t("features.progress"),
  ];

  return (
    <Container className="max-w-6xl space-y-8">
      <PageHeader title={t("pricing.title")} description={t("pricing.subtitle")} />
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">{t("pricing.currency")}</span>
        <div className="flex rounded-md border p-0.5" role="group" aria-label={t("pricing.currency")}>
          {(["UZS", "USD"] as const).map((c) => (
            <Link
              key={c}
              href={`/pricing?currency=${c}`}
              aria-current={c === currency ? "true" : undefined}
              className={cn("rounded px-3 py-1 text-sm", c === currency ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
            >
              {c === "UZS" ? "so'm" : "USD"}
            </Link>
          ))}
        </div>
        <span className="text-sm text-muted-foreground">{currency === "UZS" ? t("pricing.uzsHint") : t("pricing.usdHint")}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>{t("plans.free.name")}</CardTitle>
            <CardDescription>{t("plans.free.tagline")}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <p className="text-3xl font-bold">{formatMoney(0, currency, locale)}</p>
            <ul className="space-y-2 text-sm">
              {[
                t("features.questions", { count: freeLimits.questionsPerDay ?? 0 }),
                t("features.tests", { count: freeLimits.practiceTests ?? 0 }),
                t("features.ai", { count: freeLimits.aiAnswersPerDay }),
                t("features.tools"),
              ].map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> {f}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {ent && !ent.premium ? (
              <Badge variant="secondary">{t("pricing.current")}</Badge>
            ) : !user ? (
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">{t("pricing.startFree")}</Link>
              </Button>
            ) : null}
          </CardFooter>
        </Card>

        {paidPlans.map((p) => {
          const minor = toMinor(p.price[currency], currency);
          const days = p.periodDays;
          return (
            <Card key={p.id} className={cn("flex flex-col", p.featured && "border-primary shadow-md")}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{t(`plans.${p.id}.name`)}</CardTitle>
                  {p.featured && <Badge>{t("pricing.popular")}</Badge>}
                </div>
                <CardDescription>{t(`plans.${p.id}.tagline`)}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div>
                  <p className="text-3xl font-bold">{formatMoney(minor, currency, locale)}</p>
                  {days && <p className="text-sm text-muted-foreground">{t("pricing.perDay", { amount: formatMoney(Math.round(minor / days), currency, locale) })}</p>}
                  {p.untilTestDate && <p className="text-sm text-muted-foreground">{t("pricing.testdayNote")}</p>}
                </div>
                <ul className="space-y-2 text-sm">
                  {premiumFeatures.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {canPay ? (
                  <Button asChild className="w-full" variant={p.featured ? "default" : "outline"}>
                    <Link href={user ? `/checkout?plan=${p.id}&currency=${currency}` : `/login?next=${encodeURIComponent(`/checkout?plan=${p.id}&currency=${currency}`)}`}>
                      {t("pricing.choose", { plan: t(`plans.${p.id}.name`) })}
                    </Link>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("pricing.noProviders")}</p>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
      <p className="max-w-3xl text-sm text-muted-foreground">
        {t("pricing.faq")}{" "}
        <Link href="/refunds" className="underline">
          {t("pricing.refundPolicy")}
        </Link>
      </p>
    </Container>
  );
}
