"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { spring } from "@/lib/motion";

/**
 * Score trend: a line that draws in from left to right with a soft gradient
 * area underneath. Accessible: an SVG title/description plus a visually
 * hidden table of the points.
 */
export function TrendChart({ points, label, min = 400, max = 1600, height = 140 }: { points: { label: string; value: number }[]; label: string; min?: number; max?: number; height?: number }) {
  const reduce = useReducedMotion();
  const id = useId();
  const w = 320;
  const h = height;
  if (points.length < 2) return null;
  const lo = Math.max(min, Math.min(...points.map((p) => p.value)) - 60);
  const hi = Math.min(max, Math.max(...points.map((p) => p.value)) + 60);
  const xy = points.map((p, i) => [(i / (points.length - 1)) * (w - 12) + 6, h - 8 - ((p.value - lo) / Math.max(1, hi - lo)) * (h - 24)] as const);
  const summary = [label, points.map((p) => [p.label, p.value].join(" ")).join(", ")].join(": ");
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-labelledby={`${id}-t`}>
        <title id={`${id}-t`}>{summary}</title>
        <defs>
          <linearGradient id={`${id}-g`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--primary)", stopOpacity: 0.25 }} />
            <stop offset="100%" style={{ stopColor: "var(--primary)", stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={w} y1={h * f} y2={h * f} className="stroke-border" strokeDasharray="3 5" />
        ))}
        <motion.path d={`${line} L${xy.at(-1)![0]} ${h} L${xy[0]![0]} ${h} Z`} fill={`url(#${id}-g)`} initial={reduce ? false : { opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.5 }} />
        <motion.path
          d={line}
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-primary"
          initial={reduce ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ ...spring.soft, stiffness: 50 }}
        />
        {xy.map(([x, y], i) => (
          <motion.circle key={i} cx={x} cy={y} r={i === xy.length - 1 ? 4.5 : 3} className={i === xy.length - 1 ? "fill-primary" : "fill-surface stroke-primary"} strokeWidth={2} initial={reduce ? false : { opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ ...spring.snappy, delay: 0.2 + i * 0.08 }} />
        ))}
      </svg>
    </figure>
  );
}
