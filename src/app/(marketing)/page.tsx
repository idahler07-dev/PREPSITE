import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  BarChart3,
  BookOpen,
  BookText,
  Calculator,
  ClipboardList,
  Flame,
  ListChecks,
  Moon,
  PenLine,
  RotateCcw,
  Shapes,
  Sigma,
  Smartphone,
  Sparkles,
  SpellCheck,
  Target,
  Variable,
  type LucideIcon,
} from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { enabledProviders } from "@/server/payments";
import { paidPlans } from "@/config/plans";
import { DOMAINS } from "@/lib/taxonomy";
import { FaqList } from "@/components/marketing/faq-list";
import { HomeHero } from "@/components/home/hero";
import { FeatureTour } from "@/components/home/feature-tour";
import { Marquee, UNIVERSITY_LOGOS, type MarqueeItem } from "@/components/landing/marquees";
import { Stats } from "@/components/landing/stats";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Bento } from "@/components/landing/bento";
import { TestDay } from "@/components/landing/test-day";
import { Pricing } from "@/components/landing/pricing";
import { FinalCta, Testimonials } from "@/components/landing/closing";
import { Ribbons } from "@/components/landing/ribbons";

const FAQ_KEYS = ["official", "score", "device", "pay"] as const;

const DOMAIN_ICON: Record<string, LucideIcon> = {
  INFORMATION_AND_IDEAS: BookOpen,
  CRAFT_AND_STRUCTURE: PenLine,
  EXPRESSION_OF_IDEAS: Sparkles,
  STANDARD_ENGLISH_CONVENTIONS: SpellCheck,
  ALGEBRA: Variable,
  ADVANCED_MATH: Sigma,
  PROBLEM_SOLVING_AND_DATA_ANALYSIS: BarChart3,
  GEOMETRY_AND_TRIGONOMETRY: Shapes,
};
const FEATURE_ICONS: LucideIcon[] = [ClipboardList, Calculator, RotateCcw, ListChecks, Flame, Sparkles, BookText, Target, Smartphone, Moon];

/** Landing page, in the order of the redesign brief §3. */
export default async function HomePage() {
  const t = await getTranslations("landing");
  const f = await getTranslations("faq");
  const tx = await getTranslations("taxonomy");
  const b = await getTranslations("billing");
  const user = await getCurrentUser();
  // Signed-in students go straight to their path (brief §5).
  if (user) redirect("/dashboard");
  const startHref = "/login";

  const skills: MarqueeItem[] = DOMAINS.flatMap((d) =>
    d.skills.map((k) => ({ label: tx(`skills.${k as "INFERENCES"}`), icon: DOMAIN_ICON[d.key] ?? Target, tone: d.section === "RW" ? ("rw" as const) : ("math" as const) })),
  );
  const features: MarqueeItem[] = (t.raw("marquee.features") as string[]).map((label, i) => ({ label, icon: FEATURE_ICONS[i] ?? Sparkles, tone: "feature" as const }));
  const skillCount = DOMAINS.reduce((n, d) => n + d.skills.length, 0);
  const planNames = Object.fromEntries(paidPlans.map((p) => [p.id, b(`plans.${p.id}.name`)]));

  return (
    <>
      <HomeHero startHref={startHref} />
      <FeatureTour />

      <section aria-label={t("marquee.label")} className="space-y-3 py-4">
        <Marquee items={skills} seconds={110} />
        <Marquee items={features} reverse seconds={60} />
        {/* University logos stay off until UNIVERSITY_LOGOS has real, permitted entries. */}
        {UNIVERSITY_LOGOS.length > 0 && null}
      </section>

      <Stats skills={skillCount} />
      <Ribbons />
      <HowItWorks />
      <Bento />
      <TestDay />
      <Testimonials />
      <Pricing signedIn={false} startHref={startHref} canPay={{ UZS: enabledProviders("UZS").length > 0, USD: enabledProviders("USD").length > 0 }} planNames={planNames} />

      <section aria-labelledby="faq-title" className="mx-auto w-full max-w-[720px] px-4 py-20 sm:px-6 lg:py-28">
        <h2 id="faq-title" className="mb-8 text-center font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
          {t("faq.title")}
        </h2>
        <FaqList items={FAQ_KEYS.map((k) => ({ q: f(`items.${k}.q`), a: f(`items.${k}.a`) }))} />
      </section>

      <FinalCta startHref={startHref} />
    </>
  );
}
