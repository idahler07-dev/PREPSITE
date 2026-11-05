"use client";

import { useRef } from "react";
import { m, useInView, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { BookOpen, CalendarDays, Check, ChartLine, ClipboardList, Flame, Gift, Lock, PenLine, Route, Star, Trophy, User, RotateCcw, Zap } from "lucide-react";
import { Owl } from "@/components/mascot/owl";
import { cn } from "@/lib/utils";

/**
 * A miniature of the learning path, for the landing page. Pure presentation:
 * the real path lives in the app. Everything scales from the frame width.
 */

type NodeKind = "done" | "current" | "locked" | "chest" | "trophy";
const NODES: { kind: NodeKind; x: number; y: number }[] = [
  { kind: "done", x: 50, y: 30 },
  { kind: "done", x: 34, y: 98 },
  { kind: "current", x: 44, y: 176 },
  { kind: "locked", x: 64, y: 252 },
  { kind: "chest", x: 52, y: 318 },
  { kind: "trophy", x: 34, y: 384 },
];
/** Smooth curve through the node centres (x in %, y in px of a 100×420 box). */
const PATH = "M50 30 C 50 60, 34 66, 34 98 S 44 146, 44 176 S 64 222, 64 252 S 52 292, 52 318 S 34 356, 34 384";
const DONE_PATH = "M50 30 C 50 60, 34 66, 34 98 S 44 146, 44 176";

export function PathNode({ kind, size = 44, label }: { kind: NodeKind; size?: number; label?: string }) {
  const tone = {
    done: "bg-primary text-primary-foreground shadow-[0_4px_0_var(--primary-edge)]",
    current: "bg-primary text-primary-foreground shadow-[0_4px_0_var(--primary-edge)]",
    locked: "bg-surface-2 text-muted-foreground shadow-[0_4px_0_var(--border)] border border-border",
    chest: "bg-accent text-accent-foreground shadow-[0_4px_0_color-mix(in_oklab,var(--accent),black_22%)]",
    trophy: "bg-surface-2 text-muted-foreground shadow-[0_4px_0_var(--border)] border border-border",
  }[kind];
  const Icon = { done: Check, current: Star, locked: Lock, chest: Gift, trophy: Trophy }[kind];
  return (
    <span className="relative grid place-items-center" style={{ width: size, height: size }}>
      {kind === "current" && (
        <>
          <span aria-hidden className="node-pulse absolute inset-0 rounded-full bg-primary/40" />
          <span aria-hidden className="absolute -inset-[5px] rounded-full border-[3px] border-primary/30" />
        </>
      )}
      <span className={cn("relative grid size-full place-items-center rounded-full", tone)} aria-label={label}>
        <Icon className={cn("size-[45%]", kind === "current" && "fill-current")} strokeWidth={2.75} aria-hidden />
      </span>
    </span>
  );
}

/** The winding path with nodes; the finished part draws in blue when it scrolls into view. */
export function MiniPath({ className, owl = true, startLabel }: { className?: string; owl?: boolean; startLabel: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const reduce = useReducedMotion();
  return (
    <div ref={ref} className={cn("relative mx-auto h-[420px] w-full max-w-[260px]", className)}>
      <svg viewBox="0 0 100 420" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
        <path d={PATH} fill="none" stroke="var(--border)" strokeWidth={10} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <m.path
          d={DONE_PATH}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={10}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: reduce ? 1 : 0 }}
          animate={{ pathLength: inView || reduce ? 1 : 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </svg>
      {NODES.map((n, i) => (
        <m.div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${n.x}%`, top: n.y }}
          initial={reduce ? false : { scale: 0.4, opacity: 0 }}
          animate={inView || reduce ? { scale: 1, opacity: 1 } : undefined}
          transition={{ type: "spring", stiffness: 400, damping: 22, delay: 0.1 + i * 0.06 }}
        >
          {n.kind === "current" && (
            <m.span
              className="absolute -top-9 left-1/2 -translate-x-1/2 rounded-lg border border-border bg-surface px-2.5 py-1 font-display text-[11px] font-extrabold tracking-wide text-primary uppercase shadow-sm"
              animate={reduce ? undefined : { y: [0, -4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              {startLabel}
              <span aria-hidden className="absolute -bottom-[5px] left-1/2 size-2.5 -translate-x-1/2 rotate-45 border-r border-b border-border bg-surface" />
            </m.span>
          )}
          <PathNode kind={n.kind} size={n.kind === "current" ? 56 : 46} />
        </m.div>
      ))}
      {owl && (
        <div className="absolute top-[150px] right-[-8%] w-[34%] max-w-[92px]">
          <Owl pose="happy" className="w-full" />
        </div>
      )}
    </div>
  );
}

const NAV_ICONS = [Route, PenLine, ClipboardList, ChartLine, RotateCcw, User];

/** Score ring 0–1600 (here 1340) with a sparkline beside it. */
export function ScoreRingMini({ value = 1340, max = 1600, size = 76, caption }: { value?: number; max?: number; size?: number; caption?: string }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const pct = (value - 400) / (max - 400);
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 76 76" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <circle cx={38} cy={38} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={7} />
        <m.circle
          cx={38}
          cy={38}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c * (1 - pct) }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 60, damping: 16, delay: 0.3 }}
        />
      </svg>
      <span className="relative text-center leading-none">
        <span className="block font-display text-[15px] font-extrabold">{value}</span>
        {caption && <span className="block text-[9px] text-muted-foreground">{caption}</span>}
      </span>
    </span>
  );
}

export function Sparkline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 40" className={cn("h-10 w-full overflow-visible", className)} aria-hidden>
      <m.path
        d="M2 34 L18 30 L32 32 L48 22 L62 24 L78 12 L98 6"
        fill="none"
        stroke="var(--primary)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
      />
      <circle cx={98} cy={6} r={3.5} fill="var(--primary)" />
    </svg>
  );
}

/** The whole dashboard inside the browser frame: sidebar, path, right rail. */
export function DashboardMock() {
  const t = useTranslations("landing.mock");
  const nav = t.raw("nav") as string[];
  const days = t.raw("weekDays") as string[];
  const quests = [
    { icon: Zap, label: t("quest1"), n: t("quest1n"), pct: 70, tone: "bg-primary" },
    { icon: Check, label: t("quest2"), n: t("quest2n"), pct: 100, tone: "bg-correct" },
    { icon: RotateCcw, label: t("quest3"), n: t("quest3n"), pct: 4, tone: "bg-review" },
  ];
  return (
    <div className="grid h-full grid-cols-1 bg-background text-left md:grid-cols-[150px_1fr_220px] lg:grid-cols-[176px_1fr_250px]">
      {/* Sidebar */}
      <aside className="hidden flex-col gap-1 border-e border-border bg-surface p-3 md:flex">
        <div className="mb-3 flex items-center gap-2 px-1">
          <span className="grid size-7 place-items-center rounded-lg bg-primary font-display text-sm font-extrabold text-primary-foreground">{t("brand").charAt(0).toUpperCase()}</span>
          <span className="font-display text-[15px] font-extrabold text-primary">{t("brand")}</span>
        </div>
        {nav.map((label, i) => {
          const Icon = NAV_ICONS[i] ?? Route;
          return (
            <span
              key={label}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-2.5 py-2 font-display text-[12px] font-bold tracking-wide uppercase",
                i === 0 ? "border-2 border-primary/50 bg-primary-soft text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </span>
          );
        })}
      </aside>

      {/* Path */}
      <div className="relative overflow-hidden px-4 pt-4">
        <div className="mb-4 flex items-center justify-between gap-2 md:hidden">
          <span className="flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground">
            <CalendarDays className="size-3.5" aria-hidden />
            {t("days")}
          </span>
          <span className="flex items-center gap-3 text-[12px] font-bold">
            <span className="flex items-center gap-1 text-accent-ink">
              <Flame className="size-3.5 fill-current" aria-hidden />
              {t("streak")}
            </span>
            <span className="flex items-center gap-1 text-primary">
              <Zap className="size-3.5 fill-current" aria-hidden />
              {t("xp")}
            </span>
          </span>
        </div>
        <div className="mx-auto flex max-w-[340px] items-center justify-between rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-[0_4px_0_var(--primary-edge)]">
          <span>
            <span className="block text-[10px] font-semibold opacity-80">{t("unit")}</span>
            <span className="block font-display text-[15px] font-extrabold">{t("unitTitle")}</span>
          </span>
          <span className="grid size-9 place-items-center rounded-xl border-2 border-white/25">
            <BookOpen className="size-4" aria-hidden />
          </span>
        </div>
        <MiniPath startLabel={t("start")} className="mt-8 h-[360px] scale-[0.86] origin-top" />
      </div>

      {/* Right rail */}
      <aside className="hidden flex-col gap-3 border-s border-border p-3 md:flex">
        <div className="flex items-center justify-end gap-3 text-[12px] font-bold">
          <span className="flex items-center gap-1 text-muted-foreground">
            <CalendarDays className="size-3.5" aria-hidden />
            {t("days")}
          </span>
          <span className="flex items-center gap-1 text-accent-ink">
            <Flame className="size-3.5 fill-current" aria-hidden />
            {t("streak")}
          </span>
          <span className="flex items-center gap-1 text-primary">
            <Zap className="size-3.5 fill-current" aria-hidden />
            {t("xp")}
          </span>
          <span className="grid size-6 place-items-center rounded-full bg-primary-soft text-[10px] text-primary">{nav[5]?.charAt(0)}</span>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-sm">
          <ScoreRingMini caption={t("scoreMax")} size={68} />
          <div className="min-w-0 flex-1">
            <span className="mb-1 inline-block rounded-md bg-correct-soft px-1.5 text-[10px] font-bold text-correct-ink">{t("scoreDelta")}</span>
            <Sparkline className="h-8" />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-3 shadow-sm">
          <div className="mb-2 flex justify-between text-[11px] font-bold">
            <span>{t("week")}</span>
            <span className="text-muted-foreground">{t("weekCount")}</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => (
              <span key={i} className="flex flex-col items-center gap-1">
                <span className={cn("grid size-6 place-items-center rounded-full", i < 3 ? "bg-accent-soft text-accent" : i === 3 ? "border-2 border-primary" : "bg-surface-2")}>
                  {i < 3 && <Flame className="size-3.5 fill-current" aria-hidden />}
                </span>
                <span className="text-[9px] font-semibold text-muted-foreground">{d}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-3 shadow-sm">
          <p className="mb-2 text-[11px] font-bold">{t("quests")}</p>
          <ul className="space-y-2.5">
            {quests.map((q) => (
              <li key={q.label} className="flex items-center gap-2">
                <q.icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between text-[10px] font-semibold">
                    <span className="truncate">{q.label}</span>
                    <span className="text-muted-foreground">{q.n}</span>
                  </span>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <m.span
                      className={cn("block h-full rounded-full", q.tone)}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${q.pct}%` }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", stiffness: 80, damping: 18, delay: 0.5 }}
                    />
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-3 shadow-sm">
          <p className="mb-2 text-[11px] font-bold">{t("weak")}</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              [t("weak1"), t("weak1n")],
              [t("weak2"), t("weak2n")],
            ].map(([a, b]) => (
              <span key={a} className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold">
                {a} <span className="text-danger-ink">{b}</span>
              </span>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
