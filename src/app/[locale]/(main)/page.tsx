import { getTranslations } from "next-intl/server";
import { BookOpenCheck, ClipboardList, LineChart, Timer } from "lucide-react";
import siteConfig from "@site";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/server/auth/session";

export default async function HomePage() {
  const t = await getTranslations("home");
  const user = await getCurrentUser();
  // Real numbers only: show the bank size when there is something to show.
  const published = await db.question.count({ where: { status: "PUBLISHED", isSample: false } });

  const features = [
    { key: "bank", icon: BookOpenCheck },
    { key: "test", icon: Timer },
    { key: "drills", icon: ClipboardList },
    { key: "progress", icon: LineChart },
  ] as const;

  return (
    <>
      <section className="border-b bg-gradient-to-b from-accent/60 to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <p className="mb-3 text-sm font-semibold tracking-wide text-primary uppercase">{t("eyebrow")}</p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">{t("title")}</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{t("subtitle", { name: siteConfig.name })}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={user ? "/practice" : "/login"}>{t("ctaPrimary")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/resources">{t("ctaSecondary")}</Link>
            </Button>
          </div>
          {published > 0 && <p className="mt-6 text-sm text-muted-foreground">{t("publishedCount", { count: published })}</p>}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-2xl font-bold tracking-tight">{t("featuresTitle")}</h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ key, icon: Icon }) => (
            <li key={key} className="rounded-xl border bg-card p-5">
              <Icon className="mb-3 size-6 text-primary" aria-hidden />
              <h3 className="mb-1 font-semibold">{t(`features.${key}.title`)}</h3>
              <p className="text-sm text-muted-foreground">{t(`features.${key}.body`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-xl border bg-muted/40 p-6 sm:p-8">
          <h2 className="mb-2 text-xl font-bold">{t("officialTitle")}</h2>
          <p className="mb-4 max-w-2xl text-muted-foreground">{t("officialBody")}</p>
          <Button asChild variant="secondary">
            <Link href="/resources">{t("officialCta")}</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
