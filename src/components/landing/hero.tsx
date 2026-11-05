"use client";

import { useRef } from "react";
import { m, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useTranslations } from "next-intl";
import { Check, Flame, TrendingUp, Zap } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Owl } from "@/components/mascot/owl";
import { Magnetic } from "@/components/motion/interactive-card";
import { spring, useLiteMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { RotatingWord } from "./rotating-word";
import { DashboardMock } from "./path-mock";

const rise = { hidden: { opacity: 0, y: 16, filter: "blur(6px)" }, shown: { opacity: 1, y: 0, filter: "blur(0px)" } };

/** Hero: badge, rotating headline, two CTAs, then the product in a browser frame that tilts flat as you scroll. */
export function Hero({ startHref }: { startHref: string }) {
  const t = useTranslations("landing.hero");
  const words = t.raw("words") as string[];
  const reduce = useReducedMotion();
  const item = reduce ? { hidden: { opacity: 0 }, shown: { opacity: 1 } } : rise;

  return (
    <section className="relative overflow-hidden">
      {/* Liquid blobs + grain */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
        <span className="blob top-[-10%] left-[-12%] size-[46vw] max-h-[620px] max-w-[620px] bg-primary" />
        <span className="blob top-[8%] right-[-14%] size-[40vw] max-h-[560px] max-w-[560px] bg-[#7c3aed]" />
        <span className="blob top-[48%] left-[30%] size-[34vw] max-h-[460px] max-w-[460px] bg-accent" />
        <span className="grain" />
      </div>

      <m.div
        className="relative mx-auto flex max-w-[1160px] flex-col items-center px-4 pt-14 text-center sm:px-6 sm:pt-20 lg:pt-24"
        initial="hidden"
        animate="shown"
        transition={{ staggerChildren: 0.06, delayChildren: 0.05 }}
      >
        <m.p variants={item} transition={spring.soft} className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-[13px] font-semibold text-accent-ink">
          <Zap className="size-3.5 fill-current" aria-hidden />
          {t("badge")}
        </m.p>
        <m.h1
          variants={item}
          transition={spring.soft}
          className="mt-6 max-w-[16ch] font-display text-[2.6rem] leading-[1.04] font-extrabold tracking-[-0.03em] sm:max-w-none sm:text-6xl lg:text-[4.5rem]"
        >
          <span className="sr-only">
            {t("title")} {words[0]}
          </span>
          <span aria-hidden>
            {t("title")} <RotatingWord words={words} />
          </span>
        </m.h1>
        <m.p variants={item} transition={spring.soft} className="mt-5 max-w-[36ch] text-lg text-muted-foreground sm:text-xl">
          {t("sub")}
        </m.p>
        <m.div variants={item} transition={spring.soft} className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Magnetic className="justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={startHref}>{t("start")}</Link>
            </Button>
          </Magnetic>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <Link href="/sat/score-calculator">{t("calc")}</Link>
          </Button>
        </m.div>
      </m.div>

      <Showcase alt={t("alt")} />
    </section>
  );
}

/** Browser frame with the path dashboard. Rotates from 18° to flat while it scrolls into view. */
function Showcase({ alt }: { alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const lite = useLiteMotion();
  const reduce = useReducedMotion();
  const tm = useTranslations("landing.mock");
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 30%"] });
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.4 });
  const rotateX = useTransform(p, [0, 1], [18, 0]);
  const scale = useTransform(p, [0, 1], [0.94, 1]);
  const y = useTransform(p, [0, 1], [40, 0]);
  const flat = lite || reduce;

  return (
    <div ref={ref} className="relative mx-auto mt-24 max-w-[1160px] px-4 pb-16 sm:mt-28 sm:px-6 lg:pb-24" style={{ perspective: 1400 }}>
      <m.div style={flat ? undefined : { rotateX, scale, y, transformOrigin: "50% 0%" }} className="relative">
        {/* Owl peeking over the top edge */}
        <div className="absolute -top-[62px] left-1/2 z-0 w-[96px] -translate-x-1/2 sm:-top-[74px] sm:w-[118px]">
          <Owl pose="happy" className="w-full" />
        </div>

        <Floating className="-top-5 right-3 sm:right-auto sm:-top-6 sm:-left-8" delay={0.2}>
          <Flame className="size-4 fill-current text-accent" aria-hidden />
          <span className="font-display text-base font-extrabold">{tm("chipStreak")}</span>
        </Floating>
        <Floating className="top-[28%] -right-1 sm:top-20 sm:-right-8" delay={0.9} tone="correct">
          <TrendingUp className="size-4" aria-hidden />
          <span className="font-display text-base font-extrabold">{tm("chipScore")}</span>
        </Floating>
        <Floating className="bottom-10 -left-1 hidden sm:flex sm:bottom-20 sm:-left-10" delay={1.6} tone="correct">
          <span className="grid size-5 place-items-center rounded-full bg-correct text-white">
            <Check className="size-3.5" strokeWidth={3.5} aria-hidden />
          </span>
          <span className="font-display text-sm font-extrabold">{tm("chipCorrect")}</span>
        </Floating>

        <figure
          role="img"
          aria-label={alt}
          className="relative z-10 overflow-hidden rounded-[22px] border border-border bg-surface shadow-[0_2px_4px_rgb(15_23_42/0.04),0_40px_80px_-30px_rgb(15_23_42/0.28)] sm:rounded-[28px] dark:shadow-[0_40px_80px_-30px_rgb(0_0_0/0.7)]"
        >
          <div className="flex h-9 items-center gap-1.5 border-b border-border bg-surface px-4" aria-hidden>
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div aria-hidden className="h-[520px] sm:h-[560px]">
            <DashboardMock />
          </div>
        </figure>
      </m.div>
    </div>
  );
}

function Floating({ children, className, delay = 0, tone }: { children: React.ReactNode; className?: string; delay?: number; tone?: "correct" }) {
  const reduce = useReducedMotion();
  return (
    <m.div
      aria-hidden
      className={cn(
        "absolute z-20 flex items-center gap-1.5 rounded-2xl border bg-surface px-3 py-2 shadow-[0_12px_28px_-12px_rgb(15_23_42/0.25)]",
        tone === "correct" ? "border-correct/40 text-correct-ink" : "border-border",
        className,
      )}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 12 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 400, damping: 18, delay }}
    >
      <m.span className="flex items-center gap-1.5" animate={reduce ? undefined : { y: [0, -5, 0] }} transition={{ duration: 3.2 + delay, repeat: Infinity, ease: "easeInOut", delay }}>
        {children}
      </m.span>
    </m.div>
  );
}
