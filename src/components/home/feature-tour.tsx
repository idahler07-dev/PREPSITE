"use client";

import { m } from "motion/react";
import { useTranslations } from "next-intl";
import { ArrowRight, Check, CheckCircle2, ClipboardList, Headphones, CalendarCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { FocusScene, MockTestScene, PracticeScene, StudyPlanScene } from "@/components/illustration/scenes";
import { Cutouts } from "@/components/illustration/cutouts";
import { useReducedMotionSafe } from "@/lib/motion";
import { cn } from "@/lib/utils";

const SCENES = { plan: StudyPlanScene, practice: PracticeScene, mock: MockTestScene, focus: FocusScene } as const;
const CHIP_ICON = { plan: CalendarCheck, practice: CheckCircle2, mock: ClipboardList, focus: Headphones } as const;
const HREF = { plan: "/plan", practice: "/practice", mock: "/mocks", focus: "/sat" } as const;

type Item = { key: keyof typeof SCENES; title: string; body: string; points: string[]; chip: string; chipValue: string; cta: string };

/**
 * Feature tour (v3 plan §6.1): one row per feature, text and an illustrated
 * paper scene alternating sides. A small piece of sample UI slides onto
 * each scene. Calm on purpose: one idea per row.
 */
export function FeatureTour() {
  const t = useTranslations("home3.tour");
  const td = useTranslations("home3.demo");
  const items = t.raw("items") as Item[];
  const reduce = useReducedMotionSafe();
  const reveal = (delay = 0) =>
    reduce ? {} : { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.3 }, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const, delay } };

  return (
    <section id="tour" aria-labelledby="tour-title" className="relative scroll-mt-20 py-24 lg:py-32">
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6">
        <m.h2 id="tour-title" {...reveal()} className="mx-auto max-w-[22ch] text-center font-display text-4xl leading-[1.08] font-extrabold tracking-[-0.03em] sm:text-5xl">
          {t("title")}
        </m.h2>

        <div className="mt-20 space-y-24 lg:space-y-32">
          {items.map((it, i) => {
            const Scene = SCENES[it.key];
            const Icon = CHIP_ICON[it.key];
            const flip = i % 2 === 1;
            return (
              <article key={it.key} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
                {/* Visual: paper panel + scene + sliding sample chip */}
                <m.div {...reveal()} className={cn("relative", flip && "lg:order-2")}>
                  <div className="relative overflow-hidden rounded-[28px] border border-border bg-surface p-6 shadow-[var(--elev-sm)] sm:p-10">
                    <Cutouts variant={(i % 4) as 0 | 1 | 2 | 3} />
                    <Scene className="relative" />
                  </div>
                  <m.div
                    className={cn("absolute -bottom-5 flex items-center gap-3 rounded-2xl border border-border bg-surface py-2.5 ps-3 pe-4 shadow-[var(--elev-md)]", flip ? "left-6" : "right-6")}
                    initial={reduce ? false : { opacity: 0, x: flip ? -24 : 24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.6 }}
                  >
                    <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
                      <Icon className="size-[18px]" aria-hidden />
                    </span>
                    <span className="leading-tight">
                      <span className="block text-xs font-medium text-muted-foreground">{it.chip}</span>
                      <span className="block text-sm font-bold">{it.chipValue}</span>
                    </span>
                    <span className="ms-1 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{td("sample")}</span>
                  </m.div>
                </m.div>

                {/* Text */}
                <div className={cn("max-w-[30rem]", flip && "lg:order-1 lg:justify-self-end")}>
                  <m.p {...reveal(0.05)} className="font-display text-sm font-bold tabular-nums text-brand-a">
                    {String(i + 1).padStart(2, "0")}
                  </m.p>
                  <m.h3 {...reveal(0.1)} className="mt-2 font-display text-3xl leading-tight font-extrabold tracking-[-0.025em] sm:text-4xl">
                    {it.title}
                  </m.h3>
                  <m.p {...reveal(0.15)} className="mt-4 text-lg leading-relaxed text-muted-foreground">
                    {it.body}
                  </m.p>
                  <m.ul {...reveal(0.2)} className="mt-6 space-y-2.5">
                    {it.points.map((pt) => (
                      <li key={pt} className="flex items-center gap-2.5 font-medium">
                        <span className="grid size-5 place-items-center rounded-full bg-primary-soft text-primary">
                          <Check className="size-3" strokeWidth={3} aria-hidden />
                        </span>
                        {pt}
                      </li>
                    ))}
                  </m.ul>
                  <m.div {...reveal(0.25)}>
                    <Link href={HREF[it.key]} className="group mt-7 inline-flex items-center gap-1.5 font-semibold text-primary">
                      {it.cta}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  </m.div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
