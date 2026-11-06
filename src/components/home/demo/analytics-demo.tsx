"use client";

import { useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { useTranslations } from "next-intl";
import { TrendingUp } from "lucide-react";
import { LiquidGroup } from "@/components/motion/liquid-group";
import { cn } from "@/lib/utils";
import { DemoFrame, Skel, Tween, useCursorDemo } from "./engine";

/** Sample data for the two ranges. */
const DATA = {
  w4: { pts: [1280, 1300, 1310, 1340], kpi: [1340, 76, 22] },
  m3: { pts: [1150, 1180, 1210, 1230, 1270, 1310, 1340], kpi: [1340, 78, 61] },
} as const;
const TOPICS = { w4: [81, 66, 70, 74], m3: [84, 63, 72, 79] } as const;
const W = 460;
const H = 150;
const PAD = 14;
const LO = 1120;
const HI = 1380;

function geometry(pts: readonly number[]) {
  const step = (W - PAD * 2) / (pts.length - 1);
  const xy = pts.map((v, i) => [Math.round(PAD + i * step), Math.round(H - PAD - ((v - LO) / (HI - LO)) * (H - PAD * 2))] as const);
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  const area = `${line} L${xy.at(-1)![0]} ${H} L${xy[0]![0]} ${H} Z`;
  return { xy, line, area };
}

/** Analytics: switch range, shimmer, the chart redraws, hover a point, topics and an insight arrive. */
export function AnalyticsDemo() {
  const t = useTranslations("home3.demos.analytics");
  const ranges = t.raw("ranges") as string[];
  const kpis = t.raw("kpis") as string[];
  const topics = t.raw("topicNames") as string[];
  const [range, setRange] = useState<"w4" | "m3">("w4");
  const [loading, setLoading] = useState(false);
  const [tip, setTip] = useState<number | null>(null);
  const [hoverTopic, setHoverTopic] = useState<number | null>(null);
  const [insight, setInsight] = useState(false);
  const [draw, setDraw] = useState(0);

  const reset = () => {
    setRange("w4");
    setLoading(false);
    setTip(null);
    setHoverTopic(null);
    setInsight(false);
    setDraw((d) => d + 1);
  };
  const demo = useCursorDemo({
    reset,
    final: () => {
      setRange("m3");
      setInsight(true);
    },
    async script({ move, click, wait }) {
      await wait(900);
      await move("r1");
      await click();
      setLoading(true);
      await wait(800);
      setRange("m3");
      setLoading(false);
      setDraw((d) => d + 1);
      await wait(1500);
      for (const i of [3, 5, 6]) {
        await move(`p${i}`, { speed: 1.4 });
        setTip(i);
        await wait(i === 6 ? 1300 : 650);
      }
      setTip(null);
      await move("t0", { fx: 0.85 });
      setHoverTopic(0);
      await wait(1000);
      setHoverTopic(null);
      setInsight(true);
      await move("insight", { fx: 0.8 });
      await wait(2200);
    },
  });

  const d = DATA[range];
  const labels = t.raw(range === "w4" ? "labels4" : "labels3") as string[];
  const g = geometry(d.pts);
  const fmt = [(n: number) => String(Math.round(n)), (n: number) => `${Math.round(n)}%`, (n: number) => t("hours", { n: Math.round(n) })];

  return (
    <DemoFrame demo={demo} label={t("label")} path={t("path")} bodyClassName="p-5 sm:p-6 min-h-[430px]">
      <div className="flex items-center justify-between">
        <span className="font-display text-lg font-extrabold tracking-tight">{t("title")}</span>
        <LiquidGroup activeKey={range === "w4" ? "0" : "1"} className="flex rounded-full bg-surface-2 p-1" indicatorClassName="rounded-full bg-surface shadow-[var(--elev-sm)]">
          {ranges.map((r, i) => (
            <span key={r} data-demo={`r${i}`} data-liquid-key={String(i)} className={cn("relative rounded-full px-3 py-1 text-xs font-semibold", (range === "w4" ? 0 : 1) === i ? "text-foreground" : "text-muted-foreground")}>
              {r}
            </span>
          ))}
        </LiquidGroup>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {kpis.map((k, i) => (
          <div key={k} className="rounded-2xl border border-border p-3">
            <span className="block truncate text-[11px] font-medium text-muted-foreground">{k}</span>
            {loading ? <Skel className="mt-2 h-6 w-14" /> : <span className="mt-1 block font-display text-xl font-extrabold tracking-tight"><Tween value={d.kpi[i]!} format={fmt[i]} /></span>}
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-2xl border border-border p-3.5">
        <span className="text-xs font-semibold text-muted-foreground">{t("trend")}</span>
        <div className="relative mt-2">
          {loading && <Skel className="absolute inset-0 z-10 h-full w-full rounded-xl opacity-90" />}
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible">
            <defs>
              <linearGradient id="an-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="var(--brand-b)" stopOpacity="0.22" />
                <stop offset="1" stopColor="var(--brand-b)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1={0} x2={W} y1={Math.round(H * f)} y2={Math.round(H * f)} stroke="var(--border)" strokeDasharray="3 5" />
            ))}
            <m.path key={`a${draw}-${range}`} d={g.area} fill="url(#an-area)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.4 }} />
            <m.path
              key={`l${draw}-${range}`}
              d={g.line}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            />
            {g.xy.map(([x, y], i) => (
              <m.circle key={`${range}${i}`} cx={x} cy={y} r={tip === i ? 6 : 4} fill="var(--surface)" stroke="var(--primary)" strokeWidth={2} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 + i * 0.1 }} />
            ))}
            {tip !== null && <line x1={g.xy[tip]![0]} x2={g.xy[tip]![0]} y1={0} y2={H} stroke="var(--primary)" strokeOpacity={0.35} />}
          </svg>
          {g.xy.map(([x, y], i) => (
            <span key={i} data-demo={`p${i}`} className="absolute size-3 -translate-x-1/2 -translate-y-1/2" style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` }} />
          ))}
          <AnimatePresence>
            {tip !== null && (
              <m.span
                key="tip"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0, left: `${(g.xy[tip]![0] / W) * 100}%` }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute -top-2 z-20 -translate-x-1/2 -translate-y-full rounded-lg bg-navy px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap text-white shadow-[var(--elev-md)]"
              >
                {t("tip", { label: labels[tip] ?? "", n: d.pts[tip] ?? 0 })}
              </m.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
        <div className="space-y-2 rounded-2xl border border-border p-3.5">
          <span className="text-xs font-semibold text-muted-foreground">{t("topics")}</span>
          {topics.map((name, i) => {
            const v = TOPICS[range][i]!;
            return (
              <div key={name} data-demo={`t${i}`} className={cn("grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 rounded-lg px-1 transition-colors", hoverTopic === i && "bg-primary-soft")}>
                <span className="truncate text-[12px] font-medium">{name}</span>
                <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                  <Tween value={v} format={(n) => `${Math.round(n)}%`} />
                </span>
                <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <m.span className={cn("block h-full rounded-full", v < 70 ? "bg-warning-fill" : "bg-primary")} initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ type: "spring", stiffness: 90, damping: 18, delay: 0.1 * i }} />
                </span>
              </div>
            );
          })}
        </div>
        <AnimatePresence>
          {insight && (
            <m.div
              data-demo="insight"
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
              className="flex flex-col justify-between rounded-2xl p-4 text-white"
              style={{ background: "var(--grad-hero)" }}
            >
              <span className="grid size-8 place-items-center rounded-xl bg-white/15">
                <TrendingUp className="size-4" />
              </span>
              <span className="mt-3 block text-xs font-semibold text-white/80">{t("insightTitle")}</span>
              <span className="mt-1 block text-sm leading-snug font-semibold">{t("insight")}</span>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </DemoFrame>
  );
}
