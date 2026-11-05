"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m, useInView, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Check, Flame, RotateCcw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Owl } from "@/components/mascot/owl";
import { SpotlightCard } from "@/components/motion/interactive-card";
import { cn } from "@/lib/utils";
import { CountUp } from "./count-up";

const CLIMB_DELTA = "+160";

/** Runs a step counter while the element is on screen (paused off screen and with reduced motion). */
function useTicker(steps: number, ms: number) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!inView || reduce) return;
    const id = setInterval(() => setI((v) => (v + 1) % steps), ms);
    return () => clearInterval(id);
  }, [inView, reduce, steps, ms]);
  return { ref, i, inView };
}

function Card({ title, body, className, children, href }: { title: string; body?: string; className?: string; children: React.ReactNode; href?: string }) {
  return (
    <SpotlightCard className={cn("flex flex-col gap-4 rounded-3xl p-4 sm:p-5", className)}>
      <div className="relative min-h-[176px] flex-1 overflow-hidden rounded-2xl bg-surface-2/70">{children}</div>
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <h3 className="font-display text-lg font-extrabold">{title}</h3>
          {body && <p className="text-[15px] text-muted-foreground">{body}</p>}
        </div>
        {href && (
          <Link href={href} className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-surface transition-colors hover:border-primary/40 hover:text-primary" aria-label={title}>
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
    </SpotlightCard>
  );
}

export function Bento() {
  const t = useTranslations("landing.bento");
  return (
    <section id="features" aria-labelledby="bento-title" className="mx-auto max-w-[1160px] scroll-mt-16 px-4 py-20 sm:px-6 lg:py-28">
      <h2 id="bento-title" className="mb-10 text-center font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
        {t("title")}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title={t("bluebook.title")} body={t("bluebook.body")} className="sm:col-span-2">
          <BluebookMini />
        </Card>
        <Card title={t("owl.title")} body={t("owl.body")} className="sm:col-span-2 lg:col-span-1">
          <OwlSteps steps={t.raw("owl.steps") as string[]} />
        </Card>
        <Card title={t("mistakes.title")}>
          <MistakesMini due={t("mistakes.due")} label={t("mistakes.dueLabel")} />
        </Card>
        <Card title={t("streaks.title")}>
          <StreaksMini />
        </Card>
        <Card title={t("climb.title")} className="sm:col-span-2">
          <ClimbMini />
        </Card>
        <Card title={t("calc.title")} href="/sat/score-calculator">
          <GaugeMini />
        </Card>
      </div>
    </section>
  );
}

/** A tiny test screen: passage lines on the left, the selection walks through the choices; the timer ticks. */
function BluebookMini() {
  const { ref, i, inView } = useTicker(5, 1300);
  const [secs, setSecs] = useState(32 * 60 + 14);
  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 32 * 60)), 1000);
    return () => clearInterval(id);
  }, [inView]);
  const sel = Math.min(i, 3);
  const checked = i === 4;
  return (
    <div ref={ref} className="absolute inset-3 flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-dashed border-border px-3 py-2">
        <span className="h-2 w-24 rounded-full bg-surface-2" />
        <span className="font-display text-sm font-extrabold tabular-nums">
          {String(Math.floor(secs / 60)).padStart(2, "0")}:{String(secs % 60).padStart(2, "0")}
        </span>
        <span className="h-2 w-16 rounded-full bg-surface-2" />
      </div>
      <div className="grid flex-1 grid-cols-2">
        <div className="space-y-2 border-e border-border p-3">
          {[92, 100, 84, 96, 70, 88].map((w, k) => (
            <span key={k} className={cn("block h-1.5 rounded-full", k === 3 ? "bg-[var(--hl-yellow)]" : "bg-surface-2")} style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="space-y-1.5 p-3">
          {[0, 1, 2, 3].map((k) => {
            const on = (checked ? 0 : sel) === k;
            return (
              <span
                key={k}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors duration-200",
                  on ? (checked ? "border-correct bg-correct-soft" : "border-primary bg-primary-soft") : "border-border",
                )}
              >
                <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border text-[8px] font-bold", on ? (checked ? "border-correct bg-correct text-white" : "border-primary bg-primary text-primary-foreground") : "border-border")}>
                  {checked && on ? <Check className="size-2.5" strokeWidth={4} aria-hidden /> : String.fromCharCode(65 + k)}
                </span>
                <span className="h-1.5 flex-1 rounded-full bg-surface-2" />
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** The owl thinks, then the three explanation steps appear one by one. */
function OwlSteps({ steps }: { steps: string[] }) {
  const { ref, i } = useTicker(steps.length + 2, 1100);
  const shown = Math.min(i, steps.length);
  return (
    <div ref={ref} className="absolute inset-0 flex flex-col justify-center gap-2 p-4">
      <div className="absolute -right-1 -bottom-2 w-[84px]">
        <Owl pose={shown >= steps.length ? "correct" : "thinking"} className="w-full" bob={false} />
      </div>
      {steps.map((s, k) => (
        <m.div
          key={s}
          className="flex w-[74%] items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold shadow-sm"
          animate={{ opacity: k < shown ? 1 : 0.25, x: k < shown ? 0 : -6 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <span className={cn("grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-extrabold", k < shown ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground")}>{k + 1}</span>
          {s}
        </m.div>
      ))}
    </div>
  );
}

/** A small stack of review cards that shuffles; the due count sits on top. */
function MistakesMini({ due, label }: { due: string; label: string }) {
  const { ref, i } = useTicker(3, 1800);
  return (
    <div ref={ref} className="absolute inset-0 grid place-items-center">
      <div className="relative h-24 w-36">
        {[0, 1, 2].map((k) => {
          const pos = (k - i + 3) % 3;
          return (
            <m.div
              key={k}
              className="absolute inset-0 rounded-2xl border border-border bg-surface shadow-sm"
              animate={{ y: pos * -8, scale: 1 - pos * 0.06, rotate: pos === 0 ? 0 : pos === 1 ? -4 : 4, zIndex: 3 - pos }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              {pos === 0 && (
                <div className="flex h-full items-center justify-center gap-2">
                  <RotateCcw className="size-5 text-review" aria-hidden />
                  <span className="font-display text-4xl font-extrabold text-review">{due}</span>
                  <span className="text-xs leading-tight font-semibold text-review">{label}</span>
                </div>
              )}
            </m.div>
          );
        })}
      </div>
    </div>
  );
}

/** The week's flames light up one by one; the quest bar fills. */
function StreaksMini() {
  const { ref, i } = useTicker(9, 600);
  const lit = Math.min(i, 7);
  return (
    <div ref={ref} className="absolute inset-0 flex flex-col justify-center gap-5 p-4">
      <div className="flex justify-between">
        {Array.from({ length: 7 }, (_, k) => (
          <m.span
            key={k}
            className={cn("grid size-8 place-items-center rounded-full", k < lit ? "bg-accent-soft text-accent" : "bg-surface text-border")}
            animate={k === lit - 1 ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            <Flame className="size-4 fill-current" aria-hidden />
          </m.span>
        ))}
      </div>
      <span className="block h-2.5 overflow-hidden rounded-full bg-surface">
        <m.span className="block h-full rounded-full bg-accent" animate={{ width: `${(lit / 7) * 100}%` }} transition={{ type: "spring", stiffness: 200, damping: 26 }} />
      </span>
    </div>
  );
}

/** A score line that draws in while the number counts up. */
function ClimbMini() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const points = [1180, 1200, 1190, 1240, 1260, 1250, 1300, 1340];
  const x = (k: number) => 8 + (k / (points.length - 1)) * 284;
  const y = (v: number) => 92 - ((v - 1150) / 210) * 80;
  const d = points.map((v, k) => `${k ? "L" : "M"}${x(k)} ${y(v)}`).join(" ");
  return (
    <div ref={ref} className="absolute inset-0 flex items-center gap-4 p-4 sm:gap-6 sm:p-6">
      <div className="shrink-0">
        <CountUp to={1340} from={1180} duration={1.6} className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl" />
        <p className="mt-1 inline-block rounded-md bg-correct-soft px-1.5 text-sm font-bold text-correct-ink">{CLIMB_DELTA}</p>
      </div>
      <svg viewBox="0 0 300 100" className="h-full min-w-0 flex-1 overflow-visible" aria-hidden>
        <m.path d={`${d} L292 100 L8 100 Z`} fill="var(--primary)" initial={{ opacity: 0 }} animate={{ opacity: inView ? 0.1 : 0 }} transition={{ delay: 1, duration: 0.6 }} />
        <m.path d={d} fill="none" stroke="var(--primary)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: inView ? 1 : 0 }} transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }} />
        {points.map((v, k) => (
          <m.circle key={k} cx={x(k)} cy={y(v)} r={k === points.length - 1 ? 6 : 3.5} fill={k === points.length - 1 ? "var(--primary)" : "var(--surface)"} stroke="var(--primary)" strokeWidth={2.5} initial={{ scale: 0 }} animate={{ scale: inView ? 1 : 0 }} transition={{ delay: 0.2 * k, type: "spring", stiffness: 500, damping: 20 }} />
        ))}
      </svg>
    </div>
  );
}

/** A gauge whose needle sweeps between scores. */
function GaugeMini() {
  const { ref, i } = useTicker(4, 1500);
  const values = [1180, 1420, 1290, 1510];
  const v = values[i] ?? 1180;
  const rad = ((v - 400) / 1200) * Math.PI;
  return (
    <div ref={ref} className="absolute inset-0 flex flex-col items-center justify-center p-4">
      <svg viewBox="0 0 200 110" className="w-full max-w-[200px] overflow-visible" aria-hidden>
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="var(--surface)" strokeWidth={14} strokeLinecap="round" />
        <m.path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="var(--primary)" strokeWidth={14} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: (v - 400) / 1200 }} transition={{ type: "spring", stiffness: 110, damping: 16 }} />
        <m.circle r={11} fill="var(--surface)" stroke="var(--primary)" strokeWidth={4} initial={false} animate={{ cx: 100 - 80 * Math.cos(rad), cy: 100 - 80 * Math.sin(rad) }} transition={{ type: "spring", stiffness: 110, damping: 16 }} />
      </svg>
      <AnimatePresence mode="popLayout" initial={false}>
        <m.span key={v} className="font-display text-2xl font-extrabold tabular-nums" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
          {v}
        </m.span>
      </AnimatePresence>
    </div>
  );
}
