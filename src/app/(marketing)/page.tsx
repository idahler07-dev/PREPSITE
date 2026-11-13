import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/server/auth/session";
import { enabledProviders } from "@/server/payments";
import { paidPlans } from "@/config/plans";
import { FaqList } from "@/components/marketing/faq-list";
import { Pricing } from "@/components/landing/pricing";
import { Sprite } from "@/components/lp/sprite";
import { LpHero } from "@/components/lp/hero";
import { LpFacts } from "@/components/lp/facts";
import { LpRibbon } from "@/components/lp/ribbon";
import { LpTour } from "@/components/lp/tour";
import { TryQuestion } from "@/components/lp/try-question";
import { LpHow } from "@/components/lp/how";
import { LpFeatures } from "@/components/lp/features";
import { LpReport } from "@/components/lp/report";
import { LpCompare } from "@/components/lp/compare";
import { LpFinalCta } from "@/components/lp/final-cta";

const FAQ_KEYS = ["official", "score", "device", "pay"] as const;

/** Landing page, in the order of the redesign brief §3. */
export default async function HomePage() {
  const t = await getTranslations("landing");
  const f = await getTranslations("faq");
  const b = await getTranslations("billing");
  const user = await getCurrentUser();
  // Signed-in students go straight to their path (brief §5).
  if (user) redirect("/dashboard");
  const startHref = "/login";
  const planNames = Object.fromEntries(
    paidPlans.map((p) => [p.id, b(`plans.${p.id}.name`)]),
  );
  const monthly = paidPlans.find((p) => p.id === "monthly")!;
  const price = `$${monthly.price.USD}`;

  return (
    <>
      <Sprite />
      <LpHero startHref={startHref} price={price} />
      <LpFacts />
      <LpRibbon />
      <LpTour startHref={startHref} />
      <TryQuestion />
      <LpHow />
      <LpFeatures />
      <LpReport />
      <Pricing
        signedIn={false}
        startHref={startHref}
        canPay={{
          UZS: enabledProviders("UZS").length > 0,
          USD: enabledProviders("USD").length > 0,
        }}
        planNames={planNames}
      />
      <LpCompare price={price} />

      <section
        aria-labelledby="faq-title"
        className="mx-auto w-full max-w-[720px] px-4 py-20 sm:px-6 lg:py-28"
      >
        <h2
          id="faq-title"
          className="mb-8 text-center font-display text-3xl font-extrabold tracking-tight sm:text-5xl"
        >
          {t("faq.title")}
        </h2>
        <FaqList
          items={FAQ_KEYS.map((k) => ({
            q: f(`items.${k}.q`),
            a: f(`items.${k}.a`),
          }))}
        />
      </section>

      <LpFinalCta startHref={startHref} />
    </>
  );
}
