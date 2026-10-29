import { getLocale, getTranslations } from "next-intl/server";
import { paidPlans, toMinor, type Currency } from "@/config/plans";
import { requireUser } from "@/server/auth/session";
import { enabledProviders } from "@/server/payments";
import { Container, PageHeader } from "@/components/layout/page-header";
import { CheckoutForm } from "@/components/billing/checkout-form";

export async function generateMetadata() {
  const t = await getTranslations("billing.checkout");
  return { title: t("title"), robots: { index: false } };
}

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string; currency?: string }> }) {
  const sp = await searchParams;
  await requireUser(`/checkout?plan=${sp.plan ?? ""}&currency=${sp.currency ?? ""}`);
  const t = await getTranslations("billing.checkout");
  const locale = await getLocale();
  const providers = Object.fromEntries((["UZS", "USD"] as const).map((c) => [c, enabledProviders(c).map((p) => p.id)])) as Record<Currency, string[]>;
  return (
    <Container className="max-w-2xl">
      <PageHeader title={t("title")} />
      <CheckoutForm
        locale={locale}
        plans={paidPlans.map((p) => ({ id: p.id, price: { UZS: toMinor(p.price.UZS, "UZS"), USD: toMinor(p.price.USD, "USD") } }))}
        providers={providers}
        initialPlan={paidPlans.some((p) => p.id === sp.plan) ? sp.plan! : "quarter"}
        initialCurrency={sp.currency === "USD" ? "USD" : "UZS"}
      />
    </Container>
  );
}
