"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/*
 * Analytics charts, plain HTML/CSS (no chart library). Colors: correct /
 * incorrect use the --chart-* tokens (validated light and dark); the activity
 * heatmap is one cobalt ramp; pace is one series. Every chart has a hover
 * tooltip and a screen-reader table; identity is never color alone.
 */

const HATCH = "repeating-linear-gradient(135deg, transparent 0 3px, color-mix(in oklab, var(--surface) 35%, transparent) 3px 4.5px)";

function Tooltip({ children, x }: { children: React.ReactNode; x: number }) {
  return (
    <div
      role="presentation"
      className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2 rounded-lg border bg-surface px-2.5 py-1.5 text-xs whitespace-nowrap shadow-md"
      style={{ left: `${x}%` }}
    >
      {children}
    </div>
  );
}

function Swatch({ color, hatch = false }: { color: string; hatch?: boolean }) {
  return <span className="inline-block size-2.5 rounded-[3px]" style={{ background: hatch ? `${HATCH}, ${color}` : color }} aria-hidden />;
}

/** Correct (bottom) and incorrect (top) answers per day, stacked, last 30 days. */
export function DailyChart({ data }: { data: { day: string; correct: number; incorrect: number }[] }) {
  const t = useTranslations("analytics.daily");
  const format = useFormatter();
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(4, ...data.map((d) => d.correct + d.incorrect));
  const step = Math.ceil(max / 2);
  const top = step * 2;
  const label = (day: string) => format.dateTime(new Date(`${day}T12:00:00Z`), { month: "short", day: "numeric", timeZone: "UTC" });
  const h = hover == null ? null : data[hover]!;
  return (
    <figure className="space-y-3">
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Swatch color="var(--chart-correct)" /> {t("correct")}
        </span>
        <span className="flex items-center gap-1.5">
          <Swatch color="var(--chart-incorrect)" hatch /> {t("incorrect")}
        </span>
      </div>
      <div className="flex gap-2">
        {/* Y axis: 0, middle and top only. */}
        <div className="flex h-40 flex-col justify-between py-0 text-end font-mono text-[10px] text-muted-foreground tabular-nums" aria-hidden>
          <span className="-translate-y-1/2">{top}</span>
          <span>{step}</span>
          <span className="translate-y-1/2">{0}</span>
        </div>
        <div className="relative min-w-0 flex-1" onMouseLeave={() => setHover(null)}>
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden>
            <span className="border-t border-dashed border-border" />
            <span className="border-t border-dashed border-border" />
            <span className="border-t border-border" />
          </div>
          <div className="relative flex h-40 items-end gap-[3px]">
            {data.map((d, i) => {
              const total = d.correct + d.incorrect;
              return (
                <span
                  key={d.day}
                  aria-hidden
                  onMouseEnter={() => setHover(i)}
                  className="flex h-full min-w-0 flex-1 flex-col-reverse items-stretch gap-[2px]"
                >
                  {d.correct > 0 && (
                    <span
                      className={cn("block w-full rounded-t-[4px] transition-opacity", d.incorrect > 0 && "rounded-t-[2px]", hover != null && hover !== i && "opacity-50")}
                      style={{ height: `${(d.correct / top) * 100}%`, background: "var(--chart-correct)" }}
                    />
                  )}
                  {d.incorrect > 0 && (
                    <span
                      className={cn("block w-full rounded-t-[4px] transition-opacity", hover != null && hover !== i && "opacity-50")}
                      style={{ height: `${(d.incorrect / top) * 100}%`, background: `${HATCH}, var(--chart-incorrect)` }}
                    />
                  )}
                  {total === 0 && <span className="block h-[2px] w-full rounded-full bg-border" />}
                </span>
              );
            })}
          </div>
          {h && (
            <Tooltip x={((hover! + 0.5) / data.length) * 100}>
              <p className="font-semibold">{label(h.day)}</p>
              <p className="flex items-center gap-1.5">
                <Swatch color="var(--chart-correct)" /> {t("correctCount", { count: h.correct })}
              </p>
              <p className="flex items-center gap-1.5">
                <Swatch color="var(--chart-incorrect)" hatch /> {t("incorrectCount", { count: h.incorrect })}
              </p>
            </Tooltip>
          )}
          <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground" aria-hidden>
            <span>{label(data[0]!.day)}</span>
            <span>{label(data[Math.floor(data.length / 2)]!.day)}</span>
            <span>{label(data.at(-1)!.day)}</span>
          </div>
        </div>
      </div>
      <table className="sr-only">
        <caption>{t("title")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("date")}</th>
            <th scope="col">{t("correct")}</th>
            <th scope="col">{t("incorrect")}</th>
          </tr>
        </thead>
        <tbody>
          {data
            .filter((d) => d.correct + d.incorrect > 0)
            .map((d) => (
              <tr key={d.day}>
                <th scope="row">{label(d.day)}</th>
                <td>{d.correct}</td>
                <td>{d.incorrect}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </figure>
  );
}

const LEVELS = [0, 1, 5, 10, 20];
const levelOf = (n: number) => LEVELS.filter((l) => n >= l).length - 1;
const LEVEL_BG = ["var(--surface-2)", "color-mix(in oklab, var(--primary) 25%, var(--surface))", "color-mix(in oklab, var(--primary) 45%, var(--surface))", "color-mix(in oklab, var(--primary) 70%, var(--surface))", "var(--primary)"];

/** Questions answered per day as a week-by-week grid (Monday on top), one cobalt ramp. */
export function ActivityHeatmap({ days }: { days: { day: string; count: number | null }[] }) {
  const t = useTranslations("analytics.activity");
  const format = useFormatter();
  const [hover, setHover] = useState<number | null>(null);
  const weeks = Math.ceil(days.length / 7);
  const label = (day: string) => format.dateTime(new Date(`${day}T12:00:00Z`), { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  const active = days.filter((d) => (d.count ?? 0) > 0).length;
  return (
    <figure className="space-y-3">
      <div className="relative overflow-x-auto pb-1" onMouseLeave={() => setHover(null)}>
        <div className="relative inline-grid grid-flow-col gap-[3px]" style={{ gridTemplateRows: "repeat(7, 0.75rem)", gridTemplateColumns: `repeat(${weeks}, 0.75rem)` }}>
          {days.map((d, i) => (
            <span
              key={d.day}
              onMouseEnter={() => setHover(i)}
              className={cn("rounded-[3px]", d.count == null && "invisible", hover === i && "ring-2 ring-foreground/60 ring-offset-1 ring-offset-surface")}
              style={{ background: LEVEL_BG[levelOf(d.count ?? 0)] }}
              aria-hidden
            />
          ))}
          {hover != null && days[hover]!.count != null && (
            <Tooltip x={((Math.floor(hover / 7) + 0.5) / weeks) * 100}>
              <p className="font-semibold">{label(days[hover]!.day)}</p>
              <p>{t("count", { count: days[hover]!.count! })}</p>
            </Tooltip>
          )}
        </div>
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{t("summary", { days: active, weeks })}</span>
        <span className="flex items-center gap-1" aria-hidden>
          {t("less")}
          {LEVEL_BG.map((bg) => (
            <span key={bg} className="size-3 rounded-[3px]" style={{ background: bg }} />
          ))}
          {t("more")}
        </span>
      </figcaption>
      <p className="sr-only">{t("srSummary", { days: active, weeks })}</p>
    </figure>
  );
}

/** Average seconds per question by difficulty against the real SAT pace, one bar per difficulty. */
export function PaceChart({ section, rows, target }: { section: string; rows: { difficulty: "EASY" | "MEDIUM" | "HARD"; seconds: number; n: number }[]; target: number }) {
  const t = useTranslations("analytics.pace");
  const te = useTranslations("enums.difficulty");
  const scale = Math.max(target * 1.6, ...rows.map((r) => r.seconds)) || 1;
  return (
    <figure className="space-y-2">
      <figcaption className="flex items-baseline justify-between gap-2 text-small">
        <span className="font-medium">{section}</span>
        <span className="text-xs text-muted-foreground">{t("target", { seconds: target })}</span>
      </figcaption>
      <div className="relative space-y-1.5">
        {/* Target pace marker */}
        <span className="pointer-events-none absolute inset-y-0 z-10 border-s-2 border-dashed border-foreground/40" style={{ left: `calc(4.5rem + (100% - 4.5rem - 3.5rem) * ${target / scale})` }} aria-hidden />
        {(["EASY", "MEDIUM", "HARD"] as const).map((d) => {
          const r = rows.find((x) => x.difficulty === d);
          const over = r && r.seconds > target;
          return (
            <div key={d} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-xs text-muted-foreground">{te(d)}</span>
              <div className="h-3 min-w-0 flex-1 rounded-e-[4px] bg-surface-2">
                {r && <div className="h-full rounded-e-[4px] bg-primary" style={{ width: `${(r.seconds / scale) * 100}%` }} title={t("bar", { difficulty: te(d), seconds: r.seconds, count: r.n })} />}
              </div>
              <span className={cn("w-12 shrink-0 text-end font-mono text-xs tabular-nums", over ? "text-warning-ink" : "text-foreground")}>
                {r ? t("seconds", { seconds: r.seconds }) : "–"}
                {over && <span className="sr-only">{t("overTarget")}</span>}
              </span>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
