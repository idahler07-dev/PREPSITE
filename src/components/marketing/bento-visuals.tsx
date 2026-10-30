"use client";

import { m, useReducedMotion } from "motion/react";
import { Flag } from "lucide-react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

const TIMER = "32:14";
const CHOICES = ["A", "B", "C", "D"];
const NAV = Array.from({ length: 12 }, (_, i) => i + 1);

/** A miniature of the test screen: timer, navigator (one flagged), choices (one selected). */
export function TestScreenVisual() {
  return (
    <div aria-hidden className="pointer-events-none rounded-[var(--radius-input)] border bg-background p-4 select-none">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-2.5 w-24 rounded-full bg-surface-2" />
        <span className="rounded-full border bg-surface px-3 py-1 font-mono text-sm font-semibold tabular-nums">{TIMER}</span>
        <Flag className="size-4 text-warning-ink" />
      </div>
      <div className="mb-3 space-y-2">
        <div className="h-2.5 w-full rounded-full bg-surface-2" />
        <div className="h-2.5 w-4/5 rounded-full bg-surface-2" />
      </div>
      <div className="space-y-2">
        {CHOICES.map((k) => (
          <div key={k} className={cn("flex items-center gap-2 rounded-[10px] border px-2.5 py-2", k === "C" ? "border-primary bg-primary-soft" : "bg-surface")}>
            <span className={cn("flex size-5 items-center justify-center rounded-full border text-[10px] font-semibold", k === "C" && "border-primary bg-primary text-primary-foreground")}>{k}</span>
            <div className="h-2 w-2/3 rounded-full bg-surface-2" />
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {NAV.map((n) => (
          <span
            key={n}
            className={cn(
              "flex size-6 items-center justify-center rounded-md border font-mono text-[10px]",
              n === 3 ? "border-warning-fill bg-warning-fill text-on-fill" : n < 6 ? "border-primary/40 bg-primary-soft text-primary" : "bg-surface text-muted-foreground",
            )}
          >
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Chat bubbles for the AI tutor card. */
export function ChatVisual({ student, tutor }: { student: string; tutor: string }) {
  return (
    <div aria-hidden className="space-y-2 text-sm">
      <p className="ms-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-primary-foreground">{student}</p>
      <p className="w-fit max-w-[92%] rounded-2xl rounded-bl-md border bg-background px-3 py-2">{tutor}</p>
    </div>
  );
}

const POINTS = [1120, 1150, 1140, 1210, 1240, 1230, 1300, 1340];

/** Score trend: the line draws in from left to right with a soft gradient area underneath. */
export function TrendVisual() {
  const reduce = useReducedMotion();
  const w = 280;
  const h = 96;
  const min = 1080;
  const max = 1380;
  const pts = POINTS.map((v, i) => [(i / (POINTS.length - 1)) * w, h - ((v - min) / (max - min)) * h] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h + 4}`} className="h-28 w-full" aria-hidden>
      <defs>
        <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" className="[stop-color:var(--primary)]" stopOpacity="0.28" />
          <stop offset="100%" className="[stop-color:var(--primary)]" stopOpacity="0" />
        </linearGradient>
      </defs>
      <m.path
        d={`${line} L${w} ${h + 4} L0 ${h + 4} Z`}
        fill="url(#trend-fill)"
        initial={reduce ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
      />
      <m.path
        d={line}
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary"
        initial={reduce ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ ...spring.soft, stiffness: 60 }}
      />
    </svg>
  );
}

/** Adaptive modules: module 1, then the second module routes up. */
export function ModulesVisual({ labels }: { labels: [string, string, string] }) {
  return (
    <div aria-hidden className="flex flex-wrap items-center gap-2 text-sm font-medium">
      <span className="rounded-full border bg-background px-3 py-1.5">{labels[0]}</span>
      <svg viewBox="0 0 40 12" className="h-3 w-10 text-muted-foreground">
        <path d="M0 6h34m-5-5 6 5-6 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className="rounded-full bg-primary px-3 py-1.5 text-primary-foreground">{labels[1]}</span>
      <span className="rounded-full border border-dashed px-3 py-1.5 text-muted-foreground">{labels[2]}</span>
    </div>
  );
}
