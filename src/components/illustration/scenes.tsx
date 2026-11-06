"use client";

import { useId, useRef } from "react";
import { m, useInView } from "motion/react";
import { useReducedMotionSafe } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { A, B, C, Float, Grain, INK, Layer, PAPER, PAPER2, R, SceneDefs, STROKE, WARM } from "./kit";

/**
 * Feature scenes in the paper-cut style: three layers (back cutout, main
 * object, front accent) that slide in when the scene comes into view, with
 * one gentle idle motion each. Decorative: pages give them an aria-label
 * through `label` or hide them.
 */
const W = 400;
const H = 300;

function Scene({ className, label, children }: { className?: string; label?: string; children: (id: string, show: boolean) => React.ReactNode }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduce = useReducedMotionSafe();
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className={cn("block h-auto w-full overflow-visible", className)} {...a11y}>
      <SceneDefs id={id} />
      {children(id, inView || reduce)}
    </svg>
  );
}

const ink = { stroke: INK, strokeWidth: STROKE, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/** Back layer shared by every scene: a soft cut-paper blob and a dotted arc. */
function Backdrop({ id, show, variant = 0 }: { id: string; show: boolean; variant?: 0 | 1 | 2 | 3 }) {
  const blobs = [
    "M64 74C116 22 296 18 348 78C392 132 368 248 274 262C176 276 62 254 44 182C34 132 36 102 64 74Z",
    "M80 56C150 18 312 34 354 104C390 166 340 262 240 268C140 274 46 236 40 164C36 114 44 76 80 56Z",
    "M58 98C84 34 246 16 326 52C394 84 384 214 300 254C214 294 74 270 46 206C30 168 44 130 58 98Z",
    "M92 44C176 14 330 50 356 132C380 208 302 274 206 270C110 266 34 214 40 140C44 92 60 56 92 44Z",
  ];
  return (
    <Layer id={id} depth={0} show={show}>
      <clipPath id={`bclip-${id}`}>
        <path d={blobs[variant]} />
      </clipPath>
      <path d={blobs[variant]} fill={PAPER2} />
      {/* Paper grain, only on the cutout */}
      <g clipPath={`url(#bclip-${id})`}>
        <Grain id={id} w={W} h={H} />
      </g>
      <path d="M40 236C120 280 270 286 362 214" fill="none" stroke={A} strokeWidth={2} strokeDasharray="1 8" strokeLinecap="round" opacity={0.7} />
    </Layer>
  );
}

/* ---------- Study plan: a week calendar filling up ---------- */
export function StudyPlanScene({ className, label }: { className?: string; label?: string }) {
  const cells = Array.from({ length: 15 }, (_, i) => i);
  const filled: Record<number, string> = { 1: B, 3: C, 6: A, 8: B, 12: C };
  return (
    <Scene className={className} label={label}>
      {(id, show) => (
        <>
          <Backdrop id={id} show={show} variant={0} />
          <Layer id={id} depth={1} show={show}>
            <rect x={92} y={66} width={216} height={176} rx={R.lg} fill={PAPER} {...ink} />
            <path d={`M92 ${66 + R.lg}a${R.lg} ${R.lg} 0 0 1 ${R.lg} -${R.lg}h${216 - 2 * R.lg}a${R.lg} ${R.lg} 0 0 1 ${R.lg} ${R.lg}v18h-216z`} fill={A} {...ink} />
            {[132, 268].map((x) => (
              <rect key={x} x={x - 4} y={54} width={8} height={24} rx={4} fill={PAPER} {...ink} />
            ))}
            {cells.map((i) => {
              const col = i % 5;
              const row = Math.floor(i / 5);
              const x = 108 + col * 38;
              const y = 118 + row * 38;
              return (
                <m.rect
                  key={i}
                  x={x}
                  y={y}
                  width={30}
                  height={30}
                  rx={R.sm}
                  fill={filled[i] ?? PAPER2}
                  stroke={filled[i] ? INK : "none"}
                  strokeWidth={STROKE}
                  initial={false}
                  animate={show ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.35, delay: 0.5 + i * 0.04 }}
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                />
              );
            })}
            <m.path d="M152 177l6 6 12-13" fill="none" {...ink} stroke={PAPER} strokeWidth={3.5} initial={{ pathLength: 0 }} animate={{ pathLength: show ? 1 : 0 }} transition={{ duration: 0.4, delay: 1.3 }} />
          </Layer>
          <Layer id={id} depth={2} show={show}>
            <Float amount={5} rotate={-4}>
              <g transform="translate(300 196) rotate(-38)">
                <rect x={-8} y={-52} width={16} height={74} rx={4} fill={WARM} {...ink} />
                <path d="M-8 22L0 40L8 22Z" fill={PAPER} {...ink} />
                <path d="M-3 32L0 40L3 32Z" fill={INK} />
                <rect x={-8} y={-60} width={16} height={12} rx={4} fill={B} {...ink} />
              </g>
            </Float>
            <circle cx={84} cy={92} r={10} fill={WARM} {...ink} />
          </Layer>
        </>
      )}
    </Scene>
  );
}

/* ---------- Practice: a question with the right answer picked ---------- */
export function PracticeScene({ className, label }: { className?: string; label?: string }) {
  return (
    <Scene className={className} label={label}>
      {(id, show) => (
        <>
          <Backdrop id={id} show={show} variant={1} />
          <Layer id={id} depth={1} show={show}>
            <rect x={86} y={56} width={228} height={192} rx={R.lg} fill={PAPER} {...ink} />
            <rect x={108} y={78} width={30} height={22} rx={R.sm} fill={INK} />
            {[0, 1].map((i) => (
              <rect key={i} x={148} y={80 + i * 14} width={i ? 92 : 140} height={7} rx={3.5} fill={PAPER2} />
            ))}
            {[0, 1, 2].map((i) => {
              const sel = i === 1;
              return (
                <g key={i}>
                  <rect x={108} y={120 + i * 38} width={184} height={28} rx={14} fill={sel ? B : PAPER} {...ink} />
                  <circle cx={124} cy={134 + i * 38} r={7} fill={sel ? PAPER : PAPER2} stroke={INK} strokeWidth={2} />
                  <rect x={140} y={131 + i * 38} width={sel ? 104 : 120 - i * 10} height={6} rx={3} fill={sel ? PAPER : PAPER2} />
                </g>
              );
            })}
            <m.path d="M120 172l3 3 6-7" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: show ? 1 : 0 }} transition={{ duration: 0.35, delay: 1.1 }} />
          </Layer>
          <Layer id={id} depth={2} show={show}>
            <Float amount={6} duration={4}>
              <g transform="translate(322 74)">
                <circle r={22} fill={WARM} {...ink} />
                <rect x={-9} y={20} width={18} height={12} rx={3} fill={PAPER} {...ink} />
                <path d="M-6 -2q6 8 12 0" fill="none" {...ink} />
              </g>
            </Float>
            <path d="M350 40l8 -8M362 58l11 -2M340 30l2 -11" fill="none" {...ink} />
          </Layer>
        </>
      )}
    </Scene>
  );
}

/* ---------- Mock test: stacked sheets and a running stopwatch ---------- */
export function MockTestScene({ className, label }: { className?: string; label?: string }) {
  const reduce = useReducedMotionSafe();
  return (
    <Scene className={className} label={label}>
      {(id, show) => (
        <>
          <Backdrop id={id} show={show} variant={2} />
          <Layer id={id} depth={1} show={show}>
            <rect x={70} y={70} width={170} height={200} rx={R.md} fill={PAPER2} {...ink} transform="rotate(-7 155 170)" />
            <rect x={88} y={56} width={170} height={200} rx={R.md} fill={PAPER} {...ink} />
            {[0, 1, 2, 3].map((r) =>
              [0, 1, 2, 3].map((c) => (
                <circle key={`${r}${c}`} cx={118 + c * 30} cy={104 + r * 30} r={8} fill={(r * 4 + c) % 5 === 1 ? INK : PAPER} stroke={INK} strokeWidth={2} />
              )),
            )}
            <path d="M210 56v38l12-9 12 9V56" fill={A} {...ink} />
            <rect x={108} y={228} width={110} height={8} rx={4} fill={PAPER2} />
          </Layer>
          <Layer id={id} depth={2} show={show}>
            <Float amount={4} duration={5}>
              <g transform="translate(296 186)">
                <rect x={-8} y={-62} width={16} height={12} rx={3} fill={INK} />
                <circle r={50} fill={PAPER} {...ink} />
                <m.circle r={38} fill="none" stroke={B} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" initial={{ strokeDashoffset: 1 }} animate={{ strokeDashoffset: show ? 0.3 : 1 }} transition={{ duration: 1.6, delay: 0.8, ease: [0.22, 1, 0.36, 1] }} transform="rotate(-90)" />
                <m.line x1={0} y1={0} x2={0} y2={-30} {...ink} strokeWidth={3} animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} style={{ originX: "0px", originY: "0px" }} />
                <circle r={4} fill={INK} />
              </g>
            </Float>
          </Layer>
        </>
      )}
    </Scene>
  );
}

/* ---------- Focus: a ring timer, a mug and a leaf ---------- */
export function FocusScene({ className, label }: { className?: string; label?: string }) {
  const reduce = useReducedMotionSafe();
  return (
    <Scene className={className} label={label}>
      {(id, show) => (
        <>
          <Backdrop id={id} show={show} variant={3} />
          <Layer id={id} depth={1} show={show}>
            <circle cx={180} cy={150} r={88} fill={PAPER} {...ink} />
            <circle cx={180} cy={150} r={66} fill="none" stroke={PAPER2} strokeWidth={14} />
            <m.circle cx={180} cy={150} r={66} fill="none" stroke={A} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" transform="rotate(-90 180 150)" initial={{ strokeDashoffset: 1 }} animate={{ strokeDashoffset: show ? 0.28 : 1 }} transition={{ duration: 2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }} />
            <rect x={156} y={138} width={48} height={10} rx={5} fill={INK} />
            <rect x={164} y={156} width={32} height={7} rx={3.5} fill={PAPER2} />
          </Layer>
          <Layer id={id} depth={2} show={show}>
            <g transform="translate(300 214)">
              <path d="M-26 -30h52v40a18 18 0 0 1 -18 18h-16a18 18 0 0 1 -18 -18z" fill={WARM} {...ink} />
              <path d="M26 -20a12 12 0 0 1 0 24" fill="none" {...ink} />
              {[-10, 4].map((x, i) => (
                <m.path key={x} d={`M${x} -40q-6 -8 0 -16q6 -8 0 -16`} fill="none" {...ink} strokeWidth={2} animate={reduce ? undefined : { opacity: [0, 0.8, 0], y: [4, -6] }} transition={{ duration: 2.8, delay: i * 1.2, repeat: Infinity, ease: "easeOut" }} />
              ))}
            </g>
            <Float amount={3} rotate={6} duration={5}>
              <g transform="translate(76 210)">
                <path d="M0 40C-2 10 10 -12 34 -22C36 6 24 30 0 40Z" fill={B} {...ink} />
                <path d="M0 40C8 18 18 2 30 -14" fill="none" {...ink} strokeWidth={2} />
              </g>
            </Float>
          </Layer>
        </>
      )}
    </Scene>
  );
}
