"use client";

import { useId, useState } from "react";
import { m } from "motion/react";
import { useReducedMotionSafe } from "@/lib/motion";

export type ScorePoint = { label: string; score: number };

const W = 640;
const H = 220;
const PX = 36;
const PY = 18;

/**
 * Score progress: one line, a dashed forecast to test day with a ± band
 * (always labelled as an estimate), a hover crosshair and a table view.
 * Needs at least 4 points (the caller shows a stat card otherwise).
 */
export function ScoreChart({
  points,
  forecast,
  labels,
}: {
  points: ScorePoint[];
  forecast: { label: string; score: number; band: number } | null;
  labels: { estimate: string; table: string; date: string; score: string };
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const reduce = useReducedMotionSafe();
  const [hover, setHover] = useState<number | null>(null);

  const all = [...points.map((p) => p.score), ...(forecast ? [forecast.score + forecast.band, forecast.score - forecast.band] : [])];
  const lo = Math.max(400, Math.floor((Math.min(...all) - 40) / 50) * 50);
  const hi = Math.min(1600, Math.ceil((Math.max(...all) + 40) / 50) * 50);
  const n = points.length + (forecast ? 1 : 0);
  const x = (i: number) => Math.round(PX + (i * (W - PX * 2)) / Math.max(1, n - 1));
  const y = (v: number) => Math.round(H - PY - ((v - lo) / (hi - lo)) * (H - PY * 2));
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i)} ${y(p.score)}`).join(" ");
  const area = `${line} L${x(points.length - 1)} ${H - PY} L${x(0)} ${H - PY} Z`;
  const last = points.length - 1;
  const ticks = [lo, Math.round((lo + hi) / 2 / 10) * 10, hi];
  const range = forecast ? `${forecast.score} ± ${forecast.band}` : "";
  const hp = hover === null ? null : hover <= last ? { x: x(hover), y: y(points[hover]!.score), label: points[hover]!.label, score: points[hover]!.score, est: false } : forecast ? { x: x(n - 1), y: y(forecast.score), label: forecast.label, score: forecast.score, est: true } : null;

  return (
    <div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" role="img" aria-labelledby={`${id}-t`} onMouseLeave={() => setHover(null)}>
          <title id={`${id}-t`}>{points.map((p) => `${p.label}: ${p.score}`).join(", ") + (forecast ? `. ${labels.estimate}: ${forecast.score} ± ${forecast.band}` : "")}</title>
          <defs>
            <linearGradient id={`${id}-a`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--primary)" stopOpacity="0.16" />
              <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((v) => (
            <g key={v}>
              <line x1={PX} x2={W - PX} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeDasharray="2 6" />
              <text x={PX - 8} y={y(v) + 4} textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
                {v}
              </text>
            </g>
          ))}
          <path d={area} fill={`url(#${id}-a)`} />
          {forecast && (
            <>
              <path
                d={`M${x(last)} ${y(points[last]!.score)} L${x(n - 1)} ${y(forecast.score + forecast.band)} L${x(n - 1)} ${y(forecast.score - forecast.band)} Z`}
                fill="var(--primary)"
                opacity={0.08}
              />
              <line x1={x(last)} y1={y(points[last]!.score)} x2={x(n - 1)} y2={y(forecast.score)} stroke="var(--primary)" strokeWidth={2} strokeDasharray="5 6" strokeLinecap="round" />
              <circle cx={x(n - 1)} cy={y(forecast.score)} r={4.5} fill="var(--surface)" stroke="var(--primary)" strokeWidth={2} strokeDasharray="2 2" />
              <text x={x(n - 1)} y={y(forecast.score + forecast.band) - 8} textAnchor="end" className="fill-muted-foreground text-[11px] font-semibold">
                {labels.estimate}
              </text>
            </>
          )}
          <m.path
            d={line}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
          {points.map((p, i) => (
            <circle key={i} cx={x(i)} cy={y(p.score)} r={hover === i ? 5.5 : 4} fill="var(--surface)" stroke="var(--primary)" strokeWidth={2} />
          ))}
          {hp && <line x1={hp.x} x2={hp.x} y1={PY} y2={H - PY} stroke="var(--primary)" strokeOpacity={0.3} />}
          {/* Hit areas wider than the marks */}
          {Array.from({ length: n }, (_, i) => (
            <rect key={i} x={x(i) - (W - PX * 2) / Math.max(1, n - 1) / 2} y={0} width={(W - PX * 2) / Math.max(1, n - 1)} height={H} fill="transparent" onMouseEnter={() => setHover(i)} />
          ))}
        </svg>
        {hp && (
          <span
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-lg bg-navy px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-white shadow-[var(--elev-md)]"
            style={{ left: `${(hp.x / W) * 100}%`, top: `${(hp.y / H) * 100}%` }}
          >
            {hp.label}
            {" · "}
            <span className="tabular-nums">{hp.score}</span>
            {hp.est && ` (${labels.estimate})`}
          </span>
        )}
      </div>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground">{labels.table}</summary>
        <table className="mt-2 w-full text-start text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th className="py-1 text-start font-medium">{labels.date}</th>
              <th className="py-1 text-end font-medium">{labels.score}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={i} className="border-t border-border">
                <td className="py-1.5">{p.label}</td>
                <td className="py-1.5 text-end tabular-nums">{p.score}</td>
              </tr>
            ))}
            {forecast && (
              <tr className="border-t border-border text-muted-foreground">
                <td className="py-1.5">
                  {forecast.label} ({labels.estimate})
                </td>
                <td className="py-1.5 text-end tabular-nums">{range}</td>
              </tr>
            )}
          </tbody>
        </table>
      </details>
    </div>
  );
}
