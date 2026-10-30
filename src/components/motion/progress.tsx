"use client";

import { motion, useReducedMotion } from "motion/react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Progress bar that fills with spring.soft. `value` is 0–100. */
export function SpringBar({ value, label, className, tone = "primary" }: { value: number; label: string; className?: string; tone?: "primary" | "accent" | "correct" }) {
  const reduce = useReducedMotion();
  const v = Math.max(0, Math.min(100, value));
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)} className={cn("h-2 overflow-hidden rounded-full bg-surface-2", className)}>
      <motion.div
        className={cn("h-full origin-left rounded-full", tone === "accent" ? "bg-accent" : tone === "correct" ? "bg-correct" : "bg-primary")}
        initial={reduce ? false : { scaleX: 0 }}
        whileInView={{ scaleX: v / 100 }}
        viewport={{ once: true }}
        transition={reduce ? { duration: 0 } : spring.soft}
      />
    </div>
  );
}

/** Progress ring (e.g. today's plan). `value` is 0–100. */
export function SpringRing({ value, label, size = 56, stroke = 6, className }: { value: number; label: string; size?: number; stroke?: number; className?: string }) {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const v = Math.max(0, Math.min(100, value)) / 100;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={cn("-rotate-90", className)} role="img" aria-label={label}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-surface-2" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        className="stroke-primary"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: v }}
        transition={reduce ? { duration: 0 } : spring.soft}
      />
    </svg>
  );
}
