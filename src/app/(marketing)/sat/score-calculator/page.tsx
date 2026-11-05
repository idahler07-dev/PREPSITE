import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/server/auth/session";
import { ScoreCalculator } from "@/components/calculator/score-calculator";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("calc");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "/sat/score-calculator" },
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

const MAX = "1600";

/** Public, indexable Digital SAT score calculator (brief §4). */
export default async function ScoreCalculatorPage() {
  const t = await getTranslations("calc");
  const user = await getCurrentUser();
  return (
    <div className="mx-auto w-full max-w-[1160px] px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
      <header className="relative mb-10 overflow-visible">
        {/* Decorative: a giant outlined 1600 behind the title */}
        <span aria-hidden className="unit-numeral pointer-events-none absolute -top-10 left-[46%] hidden text-[150px] opacity-[0.14] sm:block lg:text-[180px]" style={{ WebkitTextStrokeColor: "var(--primary)" }}>
          {MAX}
        </span>
        <h1 className="relative font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{t("title")}</h1>
      </header>
      <ScoreCalculator ctaHref={user ? "/practice" : "/login"} />
    </div>
  );
}
