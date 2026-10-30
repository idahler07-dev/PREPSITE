"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Otto, Satify's octopus. Flat vector, built from simple shapes so a designer
 * can swap in polished artwork later: everything outside this file only uses
 * <Mascot pose="..." />. Colors come from the --otto-* tokens.
 *
 * Poses: wave, think, cheer, focus, sleepy, point, juggle, confused.
 * Never shown inside test questions.
 */
export type MascotPose = "wave" | "think" | "cheer" | "focus" | "sleepy" | "point" | "juggle" | "confused";

export const MASCOT_POSES: MascotPose[] = ["wave", "think", "cheer", "focus", "sleepy", "point", "juggle", "confused"];

const BODY = "var(--otto-body)";
const BELLY = "var(--otto-belly)";
const ACCENT = "var(--otto-accent)";
const EYE = "var(--otto-eye)";
const INK = "var(--otto-ink)";
const ZZ = ["z", "z"];
const QUESTION = "?";

/** Arm roots along the bottom of the head, left to right. */
const ROOTS = [62, 74, 86, 96, 104, 114, 126, 138];

/** A resting arm: down, then a little curl outward. */
function restArm(i: number) {
  const x = ROOTS[i]!;
  const k = i < 4 ? -1 : 1;
  const spread = [1.5, 1.1, 0.7, 0.3, 0.3, 0.7, 1.1, 1.5][i]!;
  const len = [22, 27, 30, 32, 32, 30, 27, 22][i]!;
  return `M${x} 132 q ${k * spread * 6} ${len * 0.8} ${k * (spread * 12 + 6)} ${len} q ${k * 7} 2 ${k * 6} -6`;
}

/** Arm raised up and out on one side (for waving, cheering, holding). */
function upArm(side: -1 | 1, root: number, reach = 1) {
  return `M${root} 124 q ${side * 20 * reach} -2 ${side * 26 * reach} -26 q ${side * 3} -12 ${side * -6} -13`;
}

function Arm({ d, dots = true, className, style }: { d: string; dots?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <g className={className} style={style}>
      <path d={d} fill="none" stroke={BODY} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
      {dots && <path d={d} fill="none" stroke={ACCENT} strokeWidth={3} strokeLinecap="round" strokeDasharray="0.1 13" strokeDashoffset={-9} opacity={0.8} />}
    </g>
  );
}

/* ---------- Study tools (simple shapes) ---------- */
const Pencil = ({ x, y, r = 0 }: { x: number; y: number; r?: number }) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <rect x={-3.5} y={-20} width={7} height={30} rx={1.5} fill="var(--flagged)" />
    <rect x={-3.5} y={-24} width={7} height={5} rx={1.5} fill={ACCENT} />
    <path d="M-3.5 10 L0 18 L3.5 10 Z" fill="#F5D9B0" />
    <path d="M-1.2 15.4 L0 18 L1.2 15.4 Z" fill={INK} />
  </g>
);
const Book = ({ x, y, r = 0 }: { x: number; y: number; r?: number }) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <rect x={-16} y={-12} width={32} height={24} rx={3} fill="var(--highlight)" />
    <rect x={-13} y={-9} width={26} height={18} rx={2} fill={EYE} opacity={0.9} />
    <path d="M0 -9 V9" stroke="var(--highlight)" strokeWidth={2} />
    <path d="M-9 -3 H-3 M-9 2 H-4 M3 -3 H9 M4 2 H9" stroke={INK} strokeOpacity={0.35} strokeWidth={1.4} strokeLinecap="round" />
  </g>
);
const Calculator = ({ x, y, r = 0 }: { x: number; y: number; r?: number }) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <rect x={-11} y={-15} width={22} height={30} rx={4} fill={INK} />
    <rect x={-7.5} y={-11} width={15} height={7} rx={1.5} fill="var(--correct)" />
    {[0, 1, 2].map((row) => [0, 1, 2].map((col) => <rect key={`${row}${col}`} x={-7.5 + col * 5.5} y={-1 + row * 5} width={4} height={3.5} rx={1} fill={EYE} opacity={0.85} />))}
  </g>
);
const Timer = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-3} y={-17} width={6} height={4} rx={1} fill={INK} />
    <circle r={13} fill={EYE} stroke={INK} strokeWidth={2.5} />
    <path d="M0 0 V-7 M0 0 L5 3" stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" />
  </g>
);
const FlagTool = ({ x, y, r = 0 }: { x: number; y: number; r?: number }) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <path d="M0 14 V-16" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
    <path d="M0 -16 H16 L12 -10 L16 -4 H0 Z" fill="var(--flagged)" />
  </g>
);
const Highlighter = ({ x, y, r = 0 }: { x: number; y: number; r?: number }) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <rect x={-5} y={-16} width={10} height={24} rx={3} fill="var(--highlight)" />
    <rect x={-5} y={-16} width={10} height={6} rx={2} fill={INK} opacity={0.7} />
    <path d="M-4 8 H4 L2 14 H-2 Z" fill="var(--highlight)" />
  </g>
);

/* ---------- Face ---------- */
function Eyes({ mood }: { mood: "open" | "closed" | "happy" | "side" }) {
  if (mood === "closed")
    return (
      <g stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none">
        <path d="M74 98 q 8 6 16 0" />
        <path d="M110 98 q 8 6 16 0" />
      </g>
    );
  if (mood === "happy")
    return (
      <g stroke={INK} strokeWidth={3.5} strokeLinecap="round" fill="none">
        <path d="M74 99 q 8 -9 16 0" />
        <path d="M110 99 q 8 -9 16 0" />
      </g>
    );
  const dx = mood === "side" ? 3 : 0;
  return (
    <g className="otto-blink">
      <ellipse cx={82} cy={97} rx={12} ry={14} fill={EYE} />
      <ellipse cx={118} cy={97} rx={12} ry={14} fill={EYE} />
      <circle cx={84 + dx} cy={99} r={6.5} fill={INK} />
      <circle cx={120 + dx} cy={99} r={6.5} fill={INK} />
      <circle cx={86.5 + dx} cy={95.5} r={2.3} fill={EYE} />
      <circle cx={122.5 + dx} cy={95.5} r={2.3} fill={EYE} />
    </g>
  );
}

function Head({ eyes, mouth }: { eyes: "open" | "closed" | "happy" | "side"; mouth: "smile" | "open" | "o" | "flat" }) {
  return (
    <g>
      {/* Dome head: a clear rounded top, not a blob. */}
      <path d="M50 112 C 48 38, 152 38, 150 112 L 150 122 C 150 134, 140 138, 100 138 C 60 138, 50 134, 50 122 Z" fill={BODY} />
      <ellipse cx={100} cy={122} rx={34} ry={13} fill={BELLY} />
      <ellipse cx={76} cy={62} rx={11} ry={5} fill={EYE} opacity={0.2} transform="rotate(-30 76 62)" />
      <Eyes mood={eyes} />
      <ellipse cx={66} cy={114} rx={7} ry={4.5} fill={ACCENT} opacity={0.75} />
      <ellipse cx={134} cy={114} rx={7} ry={4.5} fill={ACCENT} opacity={0.75} />
      {mouth === "smile" && <path d="M92 116 q 8 7 16 0" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />}
      {mouth === "open" && <path d="M91 114 q 9 14 18 0 Z" fill={INK} />}
      {mouth === "o" && <ellipse cx={100} cy={118} rx={4} ry={5} fill={INK} />}
      {mouth === "flat" && <path d="M94 118 h 12" stroke={INK} strokeWidth={3} strokeLinecap="round" />}
    </g>
  );
}

/** Arms resting except the ones a pose replaces. */
function Rest({ skip = [] as number[] }) {
  return (
    <g className="otto-wiggle">
      {ROOTS.map((_, i) => (skip.includes(i) ? null : <Arm key={i} d={restArm(i)} dots={i % 3 === 0} />))}
    </g>
  );
}

function Pose({ pose }: { pose: MascotPose }): ReactNode {
  switch (pose) {
    case "wave":
      return (
        <>
          <Rest skip={[7]} />
          <Head eyes="open" mouth="smile" />
          <g className="otto-wave" style={{ transformOrigin: "142px 124px" }}>
            <Arm d={upArm(1, 142)} />
          </g>
        </>
      );
    case "think":
      return (
        <>
          <Rest skip={[5, 6]} />
          <Head eyes="side" mouth="flat" />
          <Arm d="M126 130 q 10 6 4 -2 q -4 -6 -14 -6" dots={false} />
          <g fill={BODY} opacity={0.9}>
            <circle cx={158} cy={64} r={4} />
            <circle cx={168} cy={50} r={6} />
            <circle cx={178} cy={32} r={9} />
          </g>
        </>
      );
    case "cheer":
      return (
        <>
          <Rest skip={[0, 1, 6, 7]} />
          <Head eyes="happy" mouth="open" />
          <g className="otto-cheer">
            <Arm d={upArm(-1, 58, 1.1)} />
            <Arm d={upArm(-1, 70, 0.7)} />
            <Arm d={upArm(1, 130, 0.7)} />
            <Arm d={upArm(1, 142, 1.1)} />
          </g>
          <g fill={ACCENT}>
            <circle cx={30} cy={60} r={3} />
            <circle cx={172} cy={56} r={3} />
            <circle cx={40} cy={40} r={2} fill="var(--highlight)" />
            <circle cx={160} cy={36} r={2.5} fill="var(--highlight)" />
          </g>
        </>
      );
    case "focus":
      return (
        <>
          <Rest skip={[1, 6]} />
          <Book x={70} y={150} r={-8} />
          <Arm d="M74 132 q -4 14 -2 18" dots={false} />
          <Head eyes="open" mouth="flat" />
          <Pencil x={150} y={120} r={30} />
          <Arm d="M126 130 q 14 4 20 -4" dots={false} />
        </>
      );
    case "sleepy":
      return (
        <>
          <Rest />
          <Head eyes="closed" mouth="o" />
          <g fill={INK} opacity={0.55} fontFamily="var(--font-sans)" fontWeight={700}>
            <text x={150} y={70} fontSize={18}>
              {ZZ[0]}
            </text>
            <text x={164} y={52} fontSize={13}>
              {ZZ[1]}
            </text>
          </g>
        </>
      );
    case "point":
      return (
        <>
          <Rest skip={[7]} />
          <Head eyes="side" mouth="smile" />
          <Arm d="M142 124 q 22 0 36 -10" />
        </>
      );
    case "juggle":
      return (
        <>
          <Rest skip={[0, 1, 6, 7]} />
          <Head eyes="open" mouth="smile" />
          <g className="otto-juggle">
            <Arm d={upArm(-1, 58, 1.1)} />
            <Arm d={upArm(-1, 70, 0.7)} />
            <Arm d={upArm(1, 130, 0.7)} />
            <Arm d={upArm(1, 142, 1.1)} />
            <Pencil x={30} y={70} r={-30} />
            <Calculator x={62} y={44} r={-10} />
            <Timer x={100} y={34} />
            <FlagTool x={140} y={46} r={10} />
            <Highlighter x={172} y={72} r={28} />
          </g>
          <Book x={100} y={168} />
        </>
      );
    case "confused":
      return (
        <>
          <Rest skip={[6]} />
          <Head eyes="open" mouth="o" />
          <Arm d="M128 128 q 12 -12 4 -30" dots={false} />
          <text x={150} y={66} fontSize={34} fontWeight={700} fill="var(--highlight)" fontFamily="var(--font-sans)">
            {QUESTION}
          </text>
        </>
      );
  }
}

/**
 * <Mascot pose="wave" /> — decorative by default (aria-hidden); pass `label`
 * when Otto carries meaning. Idle blink and arm wiggle; pose changes
 * cross-fade; reduced motion turns the idle loops off.
 */
export function Mascot({ pose, className, label, hoverReact = false }: { pose: MascotPose; className?: string; label?: string; hoverReact?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className={cn("otto h-auto w-32 overflow-visible", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      whileHover={hoverReact && !reduce ? { scale: 1.04, rotate: -3 } : undefined}
      transition={spring.bouncy}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.g
          key={pose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.1 : 0.18 }}
        >
          <Pose pose={pose} />
        </motion.g>
      </AnimatePresence>
    </motion.svg>
  );
}
