"use client";

import { useId } from "react";
import { m } from "motion/react";
import { useReducedMotionSafe } from "@/lib/motion";

/** A progress ring with a label in the middle. `tone` energy is the orange gradient. */
export function GoalRing({ value, goal, label, caption, tone = "primary" }: { value: number; goal: number; label: string; caption?: string; tone?: "primary" | "energy" }) {
  const reduce = useReducedMotionSafe();
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const pct = goal > 0 ? Math.min(1, value / goal) : 0;
  const r = 54;
  return (
    <div className="relative size-[150px]">
      <svg viewBox="0 0 136 136" className="size-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFB36B" />
            <stop offset="1" stopColor="#EA6B26" />
          </linearGradient>
        </defs>
        <circle cx="68" cy="68" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="13" />
        {pct > 0 && (
          <m.circle
            cx="68"
            cy="68"
            r={r}
            fill="none"
            stroke={tone === "energy" ? `url(#${id})` : "var(--primary)"}
            strokeWidth="13"
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: pct }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </svg>
      <span className="absolute inset-0 grid place-items-center text-center">
        <span>
          <span className="block font-display text-[32px] leading-none font-extrabold tabular-nums">{label}</span>
          {caption && <span className="mt-1 block text-xs font-medium text-muted-foreground">{caption}</span>}
        </span>
      </span>
    </div>
  );
}
