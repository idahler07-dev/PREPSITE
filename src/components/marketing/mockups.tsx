"use client";

import type { ReactNode } from "react";
import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Calculator, CalendarDays, Check, ChevronLeft, ChevronRight, Flag, Flame, Highlighter, Sparkles, Timer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Mascot } from "@/components/mascot/mascot";
import { SkillMap } from "@/components/learning/skill-map";
import { TrendChart } from "@/components/learning/trend-chart";
import { Odometer } from "@/components/motion/odometer";
import { useLiteMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/*
 * Landing-page product mockups: real components with sample data (not
 * screenshots). Sample content lives in constants here; the section copy is
 * in en.json. Each mockup is labeled "Sample data" for screen readers.
 */

/** Floating mini-card: bobs gently (6s loop) and drifts a little on scroll. */
export function Floating({ children, className, delay = 0, drift = 0.08 }: { children: ReactNode; className?: string; delay?: number; drift?: number }) {
  const lite = useLiteMotion();
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (v) => -v * drift);
  return (
    <m.div className={cn("absolute z-20", className)} style={lite ? undefined : { y }}>
      <m.div animate={reduce ? undefined : { y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay }}>
        {children}
      </m.div>
    </m.div>
  );
}

const card = "rounded-[14px] border bg-surface shadow-lg";

export function ScoreMini({ score = 1340, low = 1290, high = 1390 }: { score?: number; low?: number; high?: number }) {
  const t = useTranslations("home.mini");
  return (
    <div className={cn(card, "w-48 p-4")}>
      <p className="text-label font-medium text-muted-foreground">{t("score")}</p>
      <p className="mt-1 text-[2rem] leading-none font-bold">
        <Odometer value={score} className="font-mono" />
      </p>
      <p className="mt-1 font-mono text-label text-muted-foreground">{t("scoreRange", { low, high })}</p>
    </div>
  );
}

export function StreakMini({ days = 12 }: { days?: number }) {
  const t = useTranslations("home.mini");
  return (
    <div className={cn(card, "flex items-center gap-3 p-3 pe-5")}>
      <span className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
        <Flame className="size-5" aria-hidden />
      </span>
      <div>
        <p className="text-label font-medium text-muted-foreground">{t("streak")}</p>
        <p className="font-mono text-lg font-bold tabular-nums">{t("streakDays", { count: days })}</p>
      </div>
    </div>
  );
}

const TIME_LEFT = "18:42";
export function TimerMini() {
  const t = useTranslations("home.mini");
  return (
    <div className={cn(card, "flex items-center gap-3 p-3 pe-5")}>
      <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Timer className="size-5" aria-hidden />
      </span>
      <div>
        <p className="text-label font-medium text-muted-foreground">{t("timer")}</p>
        <p className="font-mono text-lg font-bold tabular-nums">{TIME_LEFT}</p>
      </div>
    </div>
  );
}

/* ---------- Test interface mockup ---------- */
const SAMPLE = {
  section: "Math · Module 1",
  time: "24:16",
  question: "If 3x + 7 = 22, what is the value of 6x − 4?",
  choices: ["11", "26", "30", "41"],
  correct: 1,
  passage: "The city's first public library opened in 1902. Within a decade, it had become the busiest building on the main square, and its reading room stayed open until midnight.",
  rwQuestion: "Which choice best states the main idea of the text?",
  rwChoices: ["The library was built in 1902.", "The library quickly became central to city life.", "The reading room was too small.", "The main square was rebuilt."],
  steps: ["Subtract 7 from both sides: 3x = 15.", "Divide by 3: x = 5.", "Then 6x − 4 = 30 − 4 = 26."],
  ask: "Why is it B?",
};
const NAV = Array.from({ length: 22 }, (_, i) => i + 1);
const LETTERS = ["A", "B", "C", "D"];
const MIN = "′";
const DESMOS = "Desmos";

function TestChrome({ children, tools = false }: { children: ReactNode; tools?: boolean }) {
  return (
    <div className="overflow-hidden rounded-[20px] border bg-surface shadow-lg">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
        <span className="truncate text-small font-semibold">{SAMPLE.section}</span>
        <span className="rounded-full border px-3 py-1 font-mono text-small font-semibold tabular-nums">{SAMPLE.time}</span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {tools && (
            <>
              <span className="hidden items-center gap-1 rounded-full border px-2.5 py-1 text-label font-medium sm:inline-flex">
                <Calculator className="size-3.5" aria-hidden /> {DESMOS}
              </span>
              <Highlighter className="size-4" aria-hidden />
            </>
          )}
          <Flag className="size-4 text-warning-ink" aria-hidden />
        </span>
      </div>
      {children}
      <div className="flex items-center justify-between gap-3 border-t px-4 py-3 sm:px-5">
        <div className="hidden flex-wrap gap-1 sm:flex">
          {NAV.slice(0, 14).map((n) => (
            <span
              key={n}
              className={cn(
                "flex size-6 items-center justify-center rounded-md font-mono text-[10px]",
                n === 4 ? "bg-flagged text-on-fill" : n < 7 ? "bg-primary-soft text-primary" : n === 7 ? "border-2 border-primary" : "border text-muted-foreground",
              )}
            >
              {n}
            </span>
          ))}
        </div>
        <span className="flex gap-2 sm:ms-auto">
          <span className="flex size-9 items-center justify-center rounded-[12px] border">
            <ChevronLeft className="size-4" aria-hidden />
          </span>
          <span className="flex size-9 items-center justify-center rounded-[12px] bg-primary text-primary-foreground">
            <ChevronRight className="size-4" aria-hidden />
          </span>
        </span>
      </div>
    </div>
  );
}

function Choices({ items, selected, correct }: { items: string[]; selected: number; correct?: number }) {
  return (
    <div className="space-y-2">
      {items.map((c, i) => {
        const isSel = i === selected;
        const isCorrect = correct === i;
        return (
          <div
            key={c}
            className={cn(
              "flex items-center gap-3 rounded-[12px] border px-3 py-2.5 text-small",
              isCorrect ? "border-correct bg-correct-soft" : isSel ? "border-primary bg-primary-soft" : "bg-surface",
            )}
          >
            <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border text-label font-semibold", isSel && !isCorrect && "border-primary bg-primary text-primary-foreground", isCorrect && "border-correct-ink bg-correct-ink text-success-foreground")}>
              {LETTERS[i]}
            </span>
            <span className="flex-1">{c}</span>
            {isCorrect && <Check className="size-4 text-correct-ink" aria-hidden />}
          </div>
        );
      })}
    </div>
  );
}

/** Test interface with the "Ask Pip" side panel (question bank section). */
export function TutorMockup() {
  const t = useTranslations("home.mini");
  const tt = useTranslations("tutor");
  return (
    <div className="relative" aria-label={t("sample")} role="img">
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <TestChrome>
          <div className="space-y-4 p-5 sm:p-6">
            <p className="text-body">{SAMPLE.question}</p>
            <Choices items={SAMPLE.choices} selected={1} correct={1} />
          </div>
        </TestChrome>
        <div className="rounded-[20px] border bg-surface p-5 shadow-lg sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <Mascot pose="think" className="w-14" />
            <div>
              <p className="flex items-center gap-1.5 font-semibold">
                <Sparkles className="size-4 text-primary" aria-hidden /> {tt("askPip")}
              </p>
              <p className="text-label text-muted-foreground">{tt("stepByStep")}</p>
            </div>
          </div>
          <p className="mb-3 ms-auto w-fit rounded-2xl rounded-br-md bg-primary px-3 py-2 text-small text-primary-foreground">{SAMPLE.ask}</p>
          <ol className="space-y-2">
            {SAMPLE.steps.map((s, i) => (
              <m.li
                key={s}
                className="flex gap-3 rounded-[12px] bg-surface-2 p-3 text-small"
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.25 }}
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft font-mono text-label font-semibold text-primary">{i + 1}</span>
                {s}
              </m.li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

/** Full-screen-style test interface (mock tests section). */
export function MockTestMockup() {
  const t = useTranslations("home.mini");
  return (
    <div className="relative" aria-label={t("sample")} role="img">
      <TestChrome tools>
        <div className="grid gap-0 md:grid-cols-2">
          <div className="border-b p-5 text-small leading-relaxed md:border-e md:border-b-0 sm:p-6">
            <p>
              {SAMPLE.passage.slice(0, 64)}
              <mark className="hl hl-yellow">{SAMPLE.passage.slice(64, 120)}</mark>
              {SAMPLE.passage.slice(120)}
            </p>
          </div>
          <div className="space-y-4 p-5 sm:p-6">
            <p className="text-small font-medium">{SAMPLE.rwQuestion}</p>
            <Choices items={SAMPLE.rwChoices} selected={1} />
          </div>
        </div>
      </TestChrome>
    </div>
  );
}

/* ---------- Study plan ---------- */
const WEEK = [
  { day: "Mon", task: "Algebra drill", min: 20, done: true },
  { day: "Tue", task: "Words in context", min: 15, done: true },
  { day: "Wed", task: "Mistake review", min: 15, done: false },
  { day: "Thu", task: "Advanced math", min: 25, done: false },
  { day: "Sat", task: "Full practice test", min: 134, done: false },
];
export function WeeklyPlanMock() {
  const t = useTranslations("home.plan");
  return (
    <div className="rounded-[20px] border bg-surface p-5 shadow-lg sm:p-6">
      <p className="mb-4 flex items-center gap-2 font-semibold">
        <CalendarDays className="size-4 text-primary" aria-hidden /> {t("week")}
      </p>
      <ul className="space-y-2">
        {WEEK.map((d) => (
          <li key={d.day} className={cn("flex items-center gap-3 rounded-[12px] border p-3", d.done && "bg-surface-2")}>
            <span className={cn("flex size-6 items-center justify-center rounded-full border", d.done && "border-primary bg-primary text-primary-foreground")}>{d.done && <Check className="size-3.5" aria-hidden />}</span>
            <span className="w-9 font-mono text-label text-muted-foreground">{d.day}</span>
            <span className={cn("flex-1 text-small font-medium", d.done && "text-muted-foreground line-through")}>{d.task}</span>
            <span className="font-mono text-label text-muted-foreground tabular-nums">{d.min + MIN}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CountdownMock({ days = 38 }: { days?: number }) {
  const t = useTranslations("home.plan");
  return (
    <div className="rounded-[20px] border bg-surface p-5 shadow-lg sm:p-6">
      <p className="text-small font-medium text-muted-foreground">{t("countdown")}</p>
      <p className="mt-2 text-[3.5rem] leading-none font-bold tracking-tight">
        <Odometer value={days} className="font-mono" />
      </p>
      <p className="mt-2 text-small text-muted-foreground">{t("days", { count: days })}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2">
        <m.div className="h-full origin-left rounded-full bg-primary" initial={{ scaleX: 0 }} whileInView={{ scaleX: 0.62 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 170, damping: 26 }} />
      </div>
    </div>
  );
}

/* ---------- Analytics ---------- */
const SKILLS = [
  ["Linear equations", 0.86],
  ["Systems", 0.71],
  ["Quadratics", 0.42],
  ["Percentages", 0.78],
  ["Ratios", 0.9],
  ["Geometry", 0.35],
  ["Trigonometry", 0.22],
  ["Words in context", 0.66],
  ["Central ideas", 0.58],
  ["Transitions", 0.81],
  ["Boundaries", 0.49],
  ["Inferences", 0.3],
] as const;
const TREND = [1180, 1210, 1205, 1260, 1290, 1340].map((v, i) => ({ label: `Test ${i + 1}`, value: v }));
const PACE = [
  { n: 1, s: 71, max: 95 },
  { n: 2, s: 84, max: 95 },
];

export function SkillMapMock() {
  return <SkillMap tiles={SKILLS.map(([label, m]) => ({ key: label, label, mastery: m, detail: `${Math.round(m * 100)}%` }))} columns="grid-cols-3 sm:grid-cols-4" />;
}
export function TrendMock({ label }: { label: string }) {
  return <TrendChart points={TREND} label={label} />;
}
export function PacingMock() {
  const t = useTranslations("home.analytics");
  return (
    <ul className="space-y-4">
      {PACE.map((p) => (
        <li key={p.n}>
          <div className="mb-1.5 flex justify-between text-small">
            <span className="font-medium">{t("module", { n: p.n })}</span>
            <span className="font-mono tabular-nums">{t("secs", { count: p.s })}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
            <m.div className="h-full origin-left rounded-full bg-primary" initial={{ scaleX: 0 }} whileInView={{ scaleX: p.s / p.max }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 170, damping: 26, delay: p.n * 0.1 }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
