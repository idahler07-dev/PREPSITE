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

/** Public, indexable Digital SAT score calculator (brief §4). */
export default async function ScoreCalculatorPage() {
  const t = await getTranslations("calc");
  const user = await getCurrentUser();
  return (
    <div className="mx-auto w-full max-w-[1160px] px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{t("title")}</h1>
        <p className="mt-3 max-w-[44ch] text-lg text-muted-foreground">{t("sub")}</p>
      </header>
      <ScoreCalculator ctaHref={user ? "/practice" : "/login"} />
    </div>
  );
}
