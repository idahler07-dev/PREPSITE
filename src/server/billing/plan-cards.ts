import "server-only";
import { getTranslations } from "next-intl/server";
import { paidPlans, premiumLimits, toMinor, type Currency } from "@/config/plans";
import { enabledProviders } from "@/server/payments";
import { formatMoney } from "@/server/payments/notify";
import type { PlanCardData } from "@/components/billing/plan-cards";

/** Paid plan cards for the pricing page and the landing preview. */
export async function paidPlanCards(currency: Currency, signedIn: boolean): Promise<PlanCardData[]> {
  const t = await getTranslations("billing");
  const canPay = enabledProviders(currency).length > 0;
  const features = [t("features.questionsUnlimited"), t("features.testsUnlimited"), t("features.ai", { count: premiumLimits.aiAnswersPerDay }), t("features.tools"), t("features.progress")];
  return paidPlans.map((p) => {
    const minor = toMinor(p.price[currency], currency);
    const checkout = `/checkout?plan=${p.id}&currency=${currency}`;
    return {
      id: p.id,
      name: t(`plans.${p.id}.name`),
      tagline: t(`plans.${p.id}.tagline`),
      price: formatMoney(minor, currency, "en"),
      note: p.periodDays ? t("pricing.perDay", { amount: formatMoney(Math.round(minor / p.periodDays), currency, "en") }) : t("pricing.testdayNote"),
      features,
      href: canPay ? (signedIn ? checkout : `/login?next=${encodeURIComponent(checkout)}`) : undefined,
      cta: t("pricing.choose", { plan: t(`plans.${p.id}.name`) }),
      recommended: !!p.featured,
      badge: p.featured ? t("pricing.recommended") : undefined,
      disabledNote: t("pricing.noProviders"),
    };
  });
}
