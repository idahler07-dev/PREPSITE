"use client";

import { useRef, useState } from "react";
import { AnimatePresence, m, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { useTranslations } from "next-intl";
import { Bookmark, Flame } from "lucide-react";
import { Owl } from "@/components/mascot/owl";
import { cn } from "@/lib/utils";
import { CountUp } from "./count-up";
import { MiniPath } from "./path-mock";

/**
 * Sticky-scroll "How it works": on desktop the section pins while four steps
 * pass; the mockup on the right cross-fades to match. Phones get each step
 * stacked with its own mockup.
 */
export function HowItWorks() {
  const t = useTranslations("landing.how");
  const steps = t.raw("steps") as { title: string; body: string }[];
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.min(steps.length - 1, Math.max(0, Math.floor(v * steps.length * 0.999)))));

  function jump(i: number) {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (span * (i + 0.5)) / steps.length, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-16 border-y border-border bg-section-tint">
      <h2 id="how-title" className="sr-only">
        {t("title")}
      </h2>

      {/* Desktop: pinned */}
      <div ref={ref} className="relative hidden h-[300vh] lg:block">
        <div className="sticky top-0 flex h-dvh items-center">
          <div className="mx-auto grid w-full max-w-[1160px] grid-cols-[1fr_1.1fr] items-center gap-16 px-6">
            <ol className="space-y-3">
              {steps.map((s, i) => (
                <li key={s.title}>
                  <button type="button" onClick={() => jump(i)} className="group flex w-full items-start gap-4 rounded-2xl p-3 text-start" aria-current={active === i ? "step" : undefined}>
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-xl font-display text-sm font-extrabold transition-colors duration-300",
                        active === i ? "bg-primary text-primary-foreground shadow-[0_3px_0_var(--primary-edge)]" : "border border-border bg-surface text-muted-foreground",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span>
                      <span className={cn("block font-display text-3xl font-extrabold tracking-tight transition-colors duration-300", active === i ? "text-foreground" : "text-muted-foreground/55 group-hover:text-muted-foreground")}>
                        {s.title}
                      </span>
                      <AnimatePresence initial={false}>
                        {active === i && (
                          <m.span
                            className="block overflow-hidden text-lg text-muted-foreground"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 34 }}
                          >
                            <span className="block pt-1">{s.body}</span>
                          </m.span>
                        )}
                      </AnimatePresence>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="relative">
              <div className="absolute -top-[74px] right-10 z-0 w-[92px]">
                <Owl pose={active === 3 ? "correct" : active === 0 ? "thinking" : "happy"} className="w-full" />
              </div>
              <div className="relative z-10 grid h-[440px] overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_30px_60px_-30px_rgb(15_23_42/0.25)] dark:shadow-none">
                <AnimatePresence initial={false}>
                  <m.div
                    key={active}
                    className="col-start-1 row-start-1 flex items-center justify-center p-8"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -16, filter: "blur(6px)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  >
                    <StepMock i={active} />
                  </m.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phones and tablets: stacked */}
      <ol className="mx-auto grid max-w-[640px] gap-6 px-4 py-16 lg:hidden">
        {steps.map((s, i) => (
          <m.li
            key={s.title}
            className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ type: "spring", stiffness: 400, damping: 34 }}
          >
            <div className="flex items-start gap-3 p-5 pb-0">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary font-display text-sm font-extrabold text-primary-foreground shadow-[0_3px_0_var(--primary-edge)]">{i + 1}</span>
              <span>
                <span className="block font-display text-xl font-extrabold">{s.title}</span>
                <span className="block text-muted-foreground">{s.body}</span>
              </span>
            </div>
            <div className="flex justify-center p-5">
              <StepMock i={i} />
            </div>
          </m.li>
        ))}
      </ol>
    </section>
  );
}

const COMBO = 3;
const SPLIT = ", and ";
const TIMER = "32:14";

function StepMock({ i }: { i: number }) {
  if (i === 0) return <ScoreMock />;
  if (i === 1) return <PathStepMock />;
  if (i === 2) return <QuestionMock />;
  return <TestMock />;
}

/** Step 1: semicircle gauge plus the two section scores. */
function ScoreMock() {
  const t = useTranslations("landing.how");
  const R = 80;
  const len = Math.PI * R;
  const pct = (1340 - 400) / 1200;
  return (
    <div className="w-full max-w-[320px] text-center">
      <svg viewBox="0 0 200 112" className="w-full overflow-visible" aria-hidden>
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="var(--surface-2)" strokeWidth={16} strokeLinecap="round" />
        <m.path
          d="M20 100 A80 80 0 0 1 180 100"
          fill="none"
          stroke="var(--primary)"
          strokeWidth={16}
          strokeLinecap="round"
          strokeDasharray={len}
          initial={{ strokeDashoffset: len }}
          animate={{ strokeDashoffset: len * (1 - pct) }}
          transition={{ type: "spring", stiffness: 50, damping: 14, delay: 0.15 }}
        />
      </svg>
      <div className="-mt-14">
        <CountUp to={1340} from={400} className="font-display text-5xl font-extrabold tracking-tight" />
        <p className="text-sm text-muted-foreground">{t("estimate")}</p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-start">
        {[
          [t("rw"), 670, "bg-review"],
          [t("math"), 670, "bg-primary"],
        ].map(([label, v, tone]) => (
          <div key={label as string} className="rounded-2xl border border-border p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <CountUp to={v as number} from={200} className="font-display text-xl font-extrabold" />
            <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-surface-2">
              <m.span className={cn("block h-full rounded-full", tone as string)} initial={{ width: 0 }} animate={{ width: "78%" }} transition={{ type: "spring", stiffness: 70, damping: 16, delay: 0.3 }} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PathStepMock() {
  const t = useTranslations("landing.mock");
  return (
    <div className="h-[340px] w-full max-w-[300px] overflow-hidden">
      <div className="mb-2 rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground shadow-[0_4px_0_var(--primary-edge)]">
        <span className="block text-[11px] font-semibold opacity-80">{t("unit")}</span>
        <span className="block font-display font-extrabold">{t("unitTitle")}</span>
      </div>
      <MiniPath startLabel={t("start")} owl={false} className="mt-6 origin-top scale-[0.72]" />
    </div>
  );
}

/** Step 3: a lesson question mid-way, with the combo counter. */
function QuestionMock() {
  const t = useTranslations("landing.how");
  const choices = t.raw("choices") as string[];
  const q = t("q");
  const [a, b] = q.split(SPLIT);
  return (
    <div className="w-full max-w-[380px] space-y-3">
      <div className="flex items-center gap-3">
        <span className="h-3 flex-1 overflow-hidden rounded-full bg-surface-2">
          <m.span className="block h-full rounded-full bg-primary" initial={{ width: "20%" }} animate={{ width: "55%" }} transition={{ type: "spring", stiffness: 80, damping: 16, delay: 0.2 }} />
        </span>
        <span className="flex items-center gap-1 font-display text-sm font-extrabold text-accent-ink">
          <Flame className="size-4 fill-current text-accent" aria-hidden />
          {COMBO}
        </span>
      </div>
      <p className="rounded-2xl border border-border bg-background p-4 font-serif text-[15px] leading-relaxed">
        {a}
        {b && (
          <>
            {SPLIT}
            <mark className="rounded bg-[var(--hl-yellow)] px-0.5 text-[var(--hl-text)]">{b}</mark>
          </>
        )}
      </p>
      {choices.map((c, i) => (
        <m.div
          key={c}
          className={cn(
            "flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-sm font-semibold",
            i === 0 ? "border-primary bg-primary-soft text-primary shadow-[0_3px_0_var(--primary)]" : "border-border shadow-[0_3px_0_var(--border)]",
          )}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.1 + i * 0.05 }}
        >
          <span className={cn("grid size-6 place-items-center rounded-lg border text-xs", i === 0 ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{String.fromCharCode(65 + i)}</span>
          {c}
        </m.div>
      ))}
    </div>
  );
}

/** Step 4: the test screen's header and question navigator. */
function TestMock() {
  const t = useTranslations("landing.testday");
  return (
    <div className="w-full max-w-[400px] overflow-hidden rounded-2xl border border-border bg-background">
      <div className="flex items-center justify-between border-b border-dashed border-border px-4 py-3">
        <span className="max-w-[60%] text-xs leading-tight font-semibold">{t("section")}</span>
        <span className="font-display text-lg font-extrabold tabular-nums">{TIMER}</span>
      </div>
      <div className="grid grid-cols-9 gap-1.5 p-4">
        {Array.from({ length: 27 }, (_, i) => (
          <m.span
            key={i}
            className={cn(
              "relative grid aspect-square place-items-center rounded-md border text-[10px] font-bold",
              i < 11 ? "border-primary bg-primary text-primary-foreground" : i === 11 ? "border-2 border-dashed border-foreground" : "border-dashed border-border text-muted-foreground",
            )}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.015, type: "spring", stiffness: 500, damping: 26 }}
          >
            {i + 1}
            {(i === 4 || i === 9) && <Bookmark className="absolute -top-1.5 -right-1 size-3 fill-review text-review" aria-hidden />}
          </m.span>
        ))}
      </div>
    </div>
  );
}
