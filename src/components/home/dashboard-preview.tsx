"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, animate, m } from "motion/react";
import { useTranslations } from "next-intl";
import { ArrowRight, CalendarDays, Pause, Play, Sparkles } from "lucide-react";
import { LiquidGroup } from "@/components/motion/liquid-group";
import { cn } from "@/lib/utils";
import { useDemo } from "./use-demo";

/** Hold times (ms): tiles count up, recommendation arrives, chart draws, Math tab, R&W tab. */
const HOLDS = [2600, 2600, 3400, 3200, 3200];

const TREND = [1180, 1210, 1200, 1250, 1270, 1290, 1300, 1340];
const FORECAST = { to: 1410, band: 40 };
const BARS = { math: [82, 64, 71, 58], rw: [74, 61, 69, 80] };

/** A number that animates from 0 each time `run` changes. */
function Num({ value, run, format = (n: number) => String(Math.round(n)), still }: { value: number; run: number; format?: (n: number) => string; still: boolean }) {
  const [n, setN] = useState(still ? value : 0);
  useEffect(() => {
    if (still) return setN(value);
    setN(0);
    const c = animate(0, value, { duration: 1.4, ease: [0.22, 1, 0.36, 1], onUpdate: setN });
    return () => c.stop();
  }, [run, value, still]);
  return <span className="tabular-nums">{format(n)}</span>;
}

/**
 * The hero's live product preview: a sample Satify dashboard that comes to
 * life in steps. Sample data, labelled. Pauses off screen and on request.
 */
export function DashboardPreview({ label }: { label: string }) {
  const t = useTranslations("home3.preview");
  const td = useTranslations("home3.demo");
  const { ref, step, paused, toggle, reduce } = useDemo(HOLDS);
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    if (step === 0) setCycle((c) => c + 1);
  }, [step]);

  const tabs = t.raw("tabs") as string[];
  const tab = step === 3 ? 1 : step === 4 ? 2 : 0;
  const still = reduce;

  return (
    <div ref={ref} className="relative">
      <div role="img" aria-label={label} className="relative overflow-hidden rounded-[28px] border border-border bg-surface shadow-[var(--elev-lg)]">
        <div aria-hidden className="contents">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">{t("greeting")}</span>
            <span className="hidden items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary sm:inline-flex">
              <CalendarDays className="size-3.5" aria-hidden />
              {t("days")}
            </span>
          </div>
          <LiquidGroup activeKey={String(tab)} className="flex rounded-full bg-surface-2 p-1" indicatorClassName="rounded-full bg-surface shadow-[var(--elev-sm)]">
            {tabs.map((label, i) => (
              <span key={label} data-liquid-key={String(i)} className={cn("relative rounded-full px-3 py-1 text-xs font-semibold transition-colors", tab === i ? "text-foreground" : "text-muted-foreground")}>
                {label}
              </span>
            ))}
          </LiquidGroup>
        </div>

        <div className="grid gap-3 p-4 sm:p-5">
          {/* Score tiles */}
          <div className="grid grid-cols-3 gap-3">
            <Tile label={t("estimated")}>
              <span className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                <Num value={1340} run={cycle} still={still} />
              </span>
              <span className="ms-1.5 rounded-md bg-correct-soft px-1.5 py-0.5 text-[11px] font-bold text-correct-ink">{t("delta", { n: 40 })}</span>
            </Tile>
            <Tile label={t("target")}>
              <span className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                <Num value={1450} run={cycle} still={still} />
              </span>
              <span className="mt-1 block basis-full text-[11px] font-semibold text-muted-foreground">{t("gap", { n: 110 })}</span>
            </Tile>
            <Tile label={t("week")}>
              <span className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{t("weekValue")}</span>
              <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-surface-2">
                <m.span key={cycle} className="block h-full rounded-full bg-[image:var(--grad-ribbon)]" initial={{ width: still ? "79%" : 0 }} animate={{ width: "79%" }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }} />
              </span>
            </Tile>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1.45fr_1fr]">
            {/* Chart card: score trend on Overview, topic bars on Math / R&W */}
            <div className="relative h-[196px] overflow-hidden rounded-2xl border border-border bg-background p-4">
              <AnimatePresence mode="wait" initial={false}>
                {tab === 0 ? (
                  <m.div key="trend" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                      <span>{t("trend")}</span>
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <span className="h-0 w-4 border-t-2 border-dashed border-brand-b" aria-hidden />
                        {t("estimate")}
                      </span>
                    </div>
                    <TrendChart drawn={step >= 2} cycle={cycle} still={still} />
                  </m.div>
                ) : (
                  <m.div key={`bars-${tab}`} className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                    <p className="mb-3 text-xs font-semibold">{t("domains")}</p>
                    <Bars labels={t.raw(tab === 1 ? "math" : "rw") as string[]} values={tab === 1 ? BARS.math : BARS.rw} still={still} pct={(n) => t("pct", { n })} />
                  </m.div>
                )}
              </AnimatePresence>
            </div>

            {/* Recommendation */}
            <div className="relative h-[196px]">
              <AnimatePresence>
                {step >= 1 && (
                  <m.div
                    key={`rec-${cycle}`}
                    className="flex h-full flex-col justify-between rounded-2xl bg-[image:var(--grad-hero)] p-4 text-white"
                    initial={still ? false : { opacity: 0, y: 18, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  >
                    <div>
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-white/75">
                        <Sparkles className="size-3.5" aria-hidden />
                        {t("next")}
                      </p>
                      <p className="mt-2 font-display text-xl font-extrabold">{t("nextTitle")}</p>
                      <p className="text-xs text-white/80">{t("nextMeta")}</p>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <p className="max-w-[16ch] text-[11px] leading-snug text-white/70">{t("nextWhy")}</p>
                      <span className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-navy">
                        {t("start")}
                        <ArrowRight className="size-3.5" aria-hidden />
                      </span>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Sample label + play/pause */}
      <div className="mt-3 flex items-center justify-between px-1">
        <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">{td("sample")}</span>
        {!reduce && (
          <button
            type="button"
            onClick={toggle}
            aria-label={paused ? td("play") : td("pause")}
            className="grid size-8 place-items-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
          >
            {paused ? <Play className="size-3.5 fill-current" aria-hidden /> : <Pause className="size-3.5 fill-current" aria-hidden />}
          </button>
        )}
      </div>
    </div>
  );
}

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-3 sm:p-4">
      <p className="mb-1 text-[11px] font-semibold text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-baseline">{children}</div>
    </div>
  );
}

function TrendChart({ drawn, cycle, still }: { drawn: boolean; cycle: number; still: boolean }) {
  const W = 320;
  const H = 140;
  const min = 1150;
  const max = 1460;
  const n = TREND.length + 3; // room for the forecast
  const x = (i: number) => 8 + (i / (n - 1)) * (W - 16);
  const y = (v: number) => H - 10 - ((v - min) / (max - min)) * (H - 24);
  const line = TREND.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const lastX = x(TREND.length - 1);
  const lastY = y(TREND.at(-1)!);
  const endX = x(n - 1);
  const band = `M${lastX} ${lastY} L${endX} ${y(FORECAST.to + FORECAST.band)} L${endX} ${y(FORECAST.to - FORECAST.band)} Z`;
  const show = drawn || still;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[150px] w-full overflow-visible" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={0} x2={W} y1={14 + i * 38} y2={14 + i * 38} stroke="var(--border)" strokeDasharray="2 4" />
      ))}
      <m.path key={`band-${cycle}`} d={band} fill="var(--brand-b)" initial={{ opacity: 0 }} animate={{ opacity: show ? 0.14 : 0 }} transition={{ duration: 0.6, delay: still ? 0 : 1.4 }} />
      <m.path key={`fc-${cycle}`} d={`M${lastX} ${lastY} L${endX} ${y(FORECAST.to)}`} stroke="var(--brand-b)" strokeWidth={2.5} strokeDasharray="5 5" fill="none" initial={{ opacity: 0 }} animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 0.5, delay: still ? 0 : 1.4 }} />
      <m.path key={`ln-${cycle}`} d={line} stroke="var(--brand-a)" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: still ? 1 : 0 }} animate={{ pathLength: show ? 1 : 0 }} transition={{ duration: still ? 0 : 1.4, ease: [0.22, 1, 0.36, 1] }} />
      {show && <circle cx={lastX} cy={lastY} r={5} fill="var(--surface)" stroke="var(--brand-a)" strokeWidth={3} />}
    </svg>
  );
}

function Bars({ labels, values, still, pct }: { labels: string[]; values: number[]; still: boolean; pct: (n: number) => string }) {
  const weakest = values.indexOf(Math.min(...values));
  return (
    <ul className="space-y-2.5">
      {labels.map((label, i) => (
        <li key={label} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
          <span className={cn("truncate text-xs", i === weakest ? "font-bold" : "text-muted-foreground")}>{label}</span>
          <span className="text-xs font-bold tabular-nums">{pct(values[i]!)}</span>
          <span className="col-span-2 block h-2 overflow-hidden rounded-full bg-surface-2">
            <m.span
              className={cn("block h-full rounded-full", i === weakest ? "bg-accent" : "bg-brand-a")}
              initial={{ width: still ? `${values[i]}%` : 0 }}
              animate={{ width: `${values[i]}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: still ? 0 : 0.08 * i }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}
