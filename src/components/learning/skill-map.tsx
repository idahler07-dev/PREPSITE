"use client";

import { motion, useReducedMotion } from "motion/react";
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
 * Skill map: rounded tiles shaded from light to deep cobalt by mastery.
 * Tiles ripple in from the top-left on first load and recolor smoothly.
 * With `onPick`, tiles are buttons (start a drill on that skill); each tile
 * has a layoutId so it can grow into the drill.
 */
export function SkillMap({ tiles, onPick, columns = "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5", className }: { tiles: SkillTile[]; onPick?: (key: string) => void; columns?: string; className?: string }) {
  const reduce = useReducedMotion();
  const cols = 5;
  return (
    <ul className={cn("grid gap-2", columns, className)}>
      {tiles.map((t, i) => {
        const m = t.mastery;
        const pct = m == null ? 0 : Math.round(12 + m * 88);
        // White text only on the deep tiles, where it stays AA.
        const dark = m != null && m >= 0.75;
        const style = { backgroundColor: m == null ? "var(--surface-2)" : `color-mix(in oklab, var(--primary) ${pct}%, var(--primary-soft))` };
        const body = (
          <>
            <span className="line-clamp-2 text-[0.8125rem] leading-tight font-medium">{t.label}</span>
            {t.detail && <span className={cn("mt-1 block font-mono text-label tabular-nums", dark ? "opacity-90" : "text-muted-foreground")}>{t.detail}</span>}
          </>
        );
        const cls = cn(
          "flex h-full min-h-[76px] w-full flex-col justify-between rounded-[12px] p-3 text-start transition-colors duration-500",
          dark ? "text-primary-foreground" : "text-foreground",
        );
        return (
          <motion.li
            key={t.key}
            layoutId={onPick ? `skill-${t.key}` : undefined}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={reduce ? { duration: 0.2 } : { ...spring.soft, delay: ((i % cols) + Math.floor(i / cols)) * 0.04 }}
          >
            {onPick ? (
              <button type="button" onClick={() => onPick(t.key)} className={cn(cls, "focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none hover:brightness-105")} style={style}>
                {body}
              </button>
            ) : (
              <div className={cls} style={style}>
                {body}
              </div>
            )}
          </motion.li>
        );
      })}
    </ul>
  );
}
