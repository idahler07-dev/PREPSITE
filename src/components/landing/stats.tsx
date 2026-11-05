"use client";

import { m, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { CountUp } from "./count-up";

const INFINITY = "∞";

/** Three honest numbers: the skill count from the taxonomy, unlimited practice, free start. */
export function Stats({ skills }: { skills: number }) {
  const t = useTranslations("landing.stats");
  const reduce = useReducedMotion();
  const pop = reduce ? { initial: { opacity: 0 }, whileInView: { opacity: 1 } } : { initial: { opacity: 0, scale: 0.5 }, whileInView: { opacity: 1, scale: 1 } };
  const items = [
    { value: <CountUp to={skills} className="text-primary" />, label: t("skills") },
    {
      value: (
        <m.span {...pop} viewport={{ once: true }} transition={{ type: "spring", stiffness: 400, damping: 14, delay: 0.25 }} className="inline-block text-accent">
          {INFINITY}
        </m.span>
      ),
      label: t("practice"),
    },
    {
      value: (
        <m.span {...pop} viewport={{ once: true }} transition={{ type: "spring", stiffness: 400, damping: 14, delay: 0.45 }} className="inline-block text-correct-ink">
          {t("free")}
        </m.span>
      ),
      label: t("freeLabel"),
    },
  ];
  return (
    <dl className="mx-auto grid max-w-[760px] grid-cols-3 gap-4 px-4 py-14 text-center sm:py-20">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col-reverse items-center gap-1">
          <dt className="text-[13px] font-medium text-muted-foreground sm:text-[15px]">{it.label}</dt>
          <dd className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
