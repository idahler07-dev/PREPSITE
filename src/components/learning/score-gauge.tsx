"use client";

import { useTranslations } from "next-intl";
import { m, useReducedMotion } from "motion/react";
import { spring } from "@/lib/motion";

/**
 * The estimate on the 400–1600 scale: the likely range as a bar, the estimate
 * as a marker that glides in from the left (spring.soft). The numbers are
 * also written out below, so the bar is decoration.
 */
export function ScoreGauge({ score, low, high, min = 400, max = 1600 }: { score: number; low: number; high: number; min?: number; max?: number }) {
  const t = useTranslations("dashboard");
  const reduce = useReducedMotion();
  const pct = (v: number) => `${Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100))}%`;
  const transition = reduce ? { duration: 0 } : spring.soft;
  return (
    <div className="mt-4">
      <div className="relative h-2.5 rounded-full bg-foreground/10" aria-hidden>
        <m.span
          className="absolute inset-y-0 rounded-full bg-gradient-to-r from-[color-mix(in_oklab,var(--primary),white_35%)] to-primary"
          initial={reduce ? false : { left: pct(score), width: 0 }}
          animate={{ left: pct(low), width: `calc(${pct(high)} - ${pct(low)})` }}
          transition={transition}
        />
        <m.span
          className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-primary bg-surface shadow-[var(--glass-shadow)]"
          initial={reduce ? false : { left: pct(min) }}
          animate={{ left: pct(score) }}
          transition={transition}
        />
      </div>
      <div className="mt-2 flex justify-between font-mono text-label text-muted-foreground" aria-hidden>
        <span>{min}</span>
        <span>{max}</span>
      </div>
      <p className="sr-only">{t("range", { low, high })}</p>
    </div>
  );
}
