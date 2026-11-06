"use client";

import { m } from "motion/react";
import { useReducedMotionSafe } from "@/lib/motion";

/** Weekly goal ring: minutes done against the plan's minutes. */
export function GoalRing({ value, goal, label }: { value: number; goal: number; label: string }) {
  const reduce = useReducedMotionSafe();
  const pct = goal > 0 ? Math.min(1, value / goal) : 0;
  const r = 52;
  return (
    <div className="relative size-40">
      <svg viewBox="0 0 128 128" className="size-full -rotate-90" aria-hidden>
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="12" />
        <m.circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="12"
          strokeLinecap="round"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: pct }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-center">
        <span>
          <span className="block font-display text-2xl font-extrabold tabular-nums">{label}</span>
          <span className="block text-xs font-semibold text-muted-foreground tabular-nums">{Math.round(pct * 100)}%</span>
        </span>
      </span>
    </div>
  );
}
