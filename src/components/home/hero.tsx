"use client";

import { m } from "motion/react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { InfinityRibbon } from "@/components/brand/infinity-ribbon";
import { useReducedMotionSafe } from "@/lib/motion";
import { DashboardPreview } from "./dashboard-preview";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Home hero (v3 plan §6.1): headline and actions on the left, a live sample
 * dashboard on the right with the infinity ribbon behind it.
 */
export function HomeHero({ startHref }: { startHref: string }) {
  const t = useTranslations("home3.hero");
  const reduce = useReducedMotionSafe();
  const trust = t.raw("trust") as string[];
  const rise = (i: number) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease, delay: 0.06 * i } };

  return (
    <section className="relative isolate overflow-hidden">
      {/* Background: soft ice field fading into the page, fine dot grid */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_70%_20%,var(--ice-100),transparent_70%)] dark:bg-[radial-gradient(80%_60%_at_70%_20%,color-mix(in_oklab,var(--cyan-600)_18%,transparent),transparent_70%)]" />
      <div aria-hidden className="dot-grid absolute inset-0 -z-10 [mask-image:radial-gradient(70%_60%_at_70%_30%,#000,transparent)] opacity-70" />
      {/* The infinity ribbon as a faint watermark across the hero */}
      <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 -z-10 w-[1500px] max-w-none -translate-x-[42%] -translate-y-[46%] opacity-[0.16] dark:opacity-[0.22]">
        <InfinityRibbon strokeWidth={2} travel={false} />
      </div>

      <div className="mx-auto grid max-w-[1160px] items-center gap-14 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[5fr_7fr] lg:gap-12 lg:pt-20 lg:pb-28">
        <div className="max-w-[34rem]">
          <m.h1 {...rise(0)} className="font-display text-[2.75rem] leading-[1.04] font-extrabold tracking-[-0.035em] sm:text-6xl lg:text-[4rem]">
            {t("title")}
            <br />
            <span className="bg-[linear-gradient(100deg,var(--navy-900),var(--cyan-600)_60%,var(--cyan-400))] bg-clip-text text-transparent dark:bg-[linear-gradient(100deg,var(--ice-100),var(--cyan-400))]">{t("titleAccent")}</span>
          </m.h1>
          <m.p {...rise(1)} className="mt-5 max-w-[30rem] text-lg leading-relaxed text-muted-foreground">
            {t("sub")}
          </m.p>
          <m.div {...rise(2)} className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={startHref}>{t("start")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#tour">{t("how")}</a>
            </Button>
          </m.div>
          <m.ul {...rise(3)} className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-muted-foreground">
            {trust.map((s) => (
              <li key={s} className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-brand-a" strokeWidth={2.5} aria-hidden />
                {s}
              </li>
            ))}
          </m.ul>
        </div>

        <m.div
          className="relative"
          initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease, delay: 0.15 }}
        >
          <DashboardPreview label={t("alt")} />
        </m.div>
      </div>
    </section>
  );
}
