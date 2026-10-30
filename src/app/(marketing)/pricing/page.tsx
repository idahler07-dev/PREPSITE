import { getTranslations } from "next-intl/server";
import { Check, Minus } from "lucide-react";
import { freeLimits, paidPlans, premiumLimits, type Currency } from "@/config/plans";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getEntitlement } from "@/server/billing/entitlement";
import { paidPlanCards } from "@/server/billing/plan-cards";
import { emphasis } from "@/components/motion/emphasis-tags";
import { PlanCards } from "@/components/billing/plan-cards";
import { CurrencySwitch } from "@/components/billing/currency-switch";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export async function generateMetadata() {
  const t = await getTranslations("billing.pricing");
  return { title: t("titlePlain"), description: t("subtitle") };
}

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ currency?: string }> }) {
  const sp = await searchParams;
  const currency: Currency = sp.currency === "USD" ? "USD" : "UZS";
  const t = await getTranslations("billing");
  const user = await getCurrentUser();
  const ent = user ? await getEntitlement(user.id) : null;
  const cards = await paidPlanCards(currency, !!user);
  const c = (k: string, v?: Record<string, number>) => t(`pricing.compare.${k}` as "pricing.compare.title", v);

  const yes = <Check className="mx-auto size-5 text-correct-ink" aria-label={c("included")} />;
  const no = <Minus className="mx-auto size-5 text-muted-foreground" aria-label="—" />;
  const rows: { label: string; free: React.ReactNode; paid: React.ReactNode }[] = [
    { label: c("questions"), free: c("perDayCount", { count: freeLimits.questionsPerDay ?? 0 }), paid: c("unlimited") },
    { label: c("tests"), free: c("total", { count: freeLimits.practiceTests ?? 0 }), paid: c("unlimited") },
    { label: c("ai"), free: String(freeLimits.aiAnswersPerDay), paid: String(premiumLimits.aiAnswersPerDay) },
    { label: c("tools"), free: yes, paid: yes },
    { label: c("progress"), free: yes, paid: yes },
    { label: c("review"), free: no, paid: yes },
  ];

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6 lg:py-16">
      <header className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="text-h1 font-semibold">{t.rich("pricing.title", emphasis)}</h1>
        <p className="mt-4 text-lead text-muted-foreground">{t("pricing.subtitle")}</p>
        <div className="mt-6 flex flex-col items-center gap-2">
          <CurrencySwitch
            value={currency}
            label={t("pricing.currency")}
            options={[
              { value: "UZS", label: "so'm", href: "/pricing?currency=UZS" },
              { value: "USD", label: "USD", href: "/pricing?currency=USD" },
            ]}
          />
          <p className="text-sm text-muted-foreground">{currency === "UZS" ? t("pricing.uzsHint") : t("pricing.usdHint")}</p>
        </div>
      </header>

      <PlanCards plans={cards} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-surface p-5 shadow-sm">
        <div>
          <p className="font-semibold">{t("pricing.freeTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("pricing.freeBody", { questions: freeLimits.questionsPerDay ?? 0, tests: freeLimits.practiceTests ?? 0, ai: freeLimits.aiAnswersPerDay })}
          </p>
        </div>
        {ent && !ent.premium ? (
          <span className="rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">{t("pricing.current")}</span>
        ) : !user ? (
          <Button asChild variant="secondary">
            <Link href="/login">{t("pricing.startFree")}</Link>
          </Button>
        ) : null}
      </div>

      <section className="mt-14" aria-labelledby="compare">
        <h2 id="compare" className="mb-4 text-h2 font-semibold">
          {c("title")}
        </h2>
        <div className="overflow-x-auto rounded-lg border bg-surface shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-48">{c("feature")}</TableHead>
                <TableHead className="text-center">{c("free")}</TableHead>
                {paidPlans.map((p) => (
                  <TableHead key={p.id} className={p.featured ? "text-center text-primary" : "text-center"}>
                    {t(`plans.${p.id}.name`)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.label}>
                  <TableCell className="font-medium">{r.label}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{r.free}</TableCell>
                  {paidPlans.map((p) => (
                    <TableCell key={p.id} className={p.featured ? "bg-primary-soft/40 text-center font-medium" : "text-center"}>
                      {r.paid}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <p className="mt-8 max-w-3xl text-sm text-muted-foreground">
        {t("pricing.faq")}{" "}
        <Link href="/refunds" className="underline">
          {t("pricing.refundPolicy")}
        </Link>
      </p>
    </div>
  );
}
