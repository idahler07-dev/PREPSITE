"use client";

import { m, useReducedMotion } from "motion/react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface SkillTile {
  key: string;
  label: string;
  /** 0–1, or null when there's no data yet. */
  mastery: number | null;
  detail?: string;
}

/**
 * Skill map: a list, one row per skill, with its full name, a thin mastery
 * bar that fills in when it scrolls into view (spring.soft), and the
 * percentage. With `onPick`, each row is a button that starts a drill on
 * that skill. Two columns from small screens up.
 */
export function SkillMap({ tiles, onPick, className }: { tiles: SkillTile[]; onPick?: (key: string) => void; columns?: string; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <ul className={cn("grid gap-x-8 sm:grid-cols-2", className)}>
      {tiles.map((t, i) => {
        const pct = t.mastery == null ? null : Math.round(t.mastery * 100);
        const body = (
          <>
            <span className="min-w-0 flex-1 text-[0.9375rem] leading-snug font-medium">{t.label}</span>
            <span className="flex w-28 shrink-0 items-center gap-2.5">
              <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10" aria-hidden>
                {pct != null && (
                  <m.span
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[color-mix(in_oklab,var(--primary),white_30%)] to-primary"
                    initial={reduce ? false : { width: 0 }}
                    whileInView={{ width: `${Math.max(4, pct)}%` }}
                    viewport={{ once: true }}
                    transition={reduce ? { duration: 0 } : { ...spring.soft, delay: Math.min(i, 12) * 0.03 }}
                  />
                )}
              </span>
              <span className={cn("w-9 text-end text-sm tabular-nums", pct == null ? "text-muted-foreground" : "font-semibold")}>{pct == null ? "–" : `${pct}%`}</span>
            </span>
          </>
        );
        const cls = "flex min-h-12 w-full items-center gap-4 border-b border-border/70 py-2.5 text-start";
        return (
          <li key={t.key}>
            {onPick ? (
              <button
                type="button"
                onClick={() => onPick(t.key)}
                className={cn(cls, "-mx-2 w-[calc(100%+1rem)] rounded-lg px-2 transition-colors hover:bg-primary-soft/60 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none motion-safe:active:scale-[0.99]")}
              >
                {body}
              </button>
            ) : (
              <div className={cls}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
