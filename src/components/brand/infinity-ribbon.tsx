"use client";

import { useId, useRef } from "react";
import { m, useInView } from "motion/react";
import { useReducedMotionSafe } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The infinity ribbon: Satify's recurring brand graphic (practise, review,
 * improve, repeat). A true lemniscate drawn as a soft wide band with a crisp
 * core line. It draws in once when it scrolls into view; afterwards a short
 * light travels along it every few seconds. Static under reduced motion.
 * Decorative only.
 */

const W = 400;
const H = 200;

/** Lemniscate of Bernoulli, sampled and rounded so server and browser output match. */
function lemniscate(a = 172, cx = W / 2, cy = H / 2, steps = 120): string {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const d = 1 + Math.sin(t) ** 2;
    const x = cx + (a * Math.cos(t)) / d;
    const y = cy + (a * Math.sin(t) * Math.cos(t)) / d;
    pts.push(`${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join(" ") + "Z";
}

const PATH = lemniscate();

export function InfinityRibbon({ className, travel = true, strokeWidth = 3 }: { className?: string; travel?: boolean; strokeWidth?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotionSafe();
  const drawn = reduce || inView;
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className={cn("block h-auto w-full overflow-visible", className)} aria-hidden fill="none">
      <defs>
        <linearGradient id={`rib-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--brand-a)" />
          <stop offset="0.55" stopColor="var(--brand-b)" />
          <stop offset="1" stopColor="var(--brand-c)" />
        </linearGradient>
      </defs>
      {/* Soft band */}
      <m.path
        d={PATH}
        stroke={`url(#rib-${id})`}
        strokeWidth={strokeWidth * 5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.18}
        initial={{ pathLength: reduce ? 1 : 0 }}
        animate={{ pathLength: drawn ? 1 : 0 }}
        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Core line */}
      <m.path
        d={PATH}
        stroke={`url(#rib-${id})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: reduce ? 1 : 0 }}
        animate={{ pathLength: drawn ? 1 : 0 }}
        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Travelling light */}
      {travel && !reduce && drawn && (
        <m.path
          d={PATH}
          pathLength={1}
          stroke="white"
          strokeOpacity={0.85}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray="0.12 0.88"
          initial={{ strokeDashoffset: 1 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 3.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 4.8, delay: 1.8 }}
        />
      )}
    </svg>
  );
}

/** Small looping ribbon for loading states: the line chases itself round the figure eight. */
export function RibbonLoader({ className, label }: { className?: string; label?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const reduce = useReducedMotionSafe();
  return (
    <span role="status" aria-label={label} className={cn("inline-block w-16", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" aria-hidden fill="none">
        <defs>
          <linearGradient id={`rl-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--brand-a)" />
            <stop offset="1" stopColor="var(--brand-b)" />
          </linearGradient>
        </defs>
        <path d={PATH} stroke="var(--border)" strokeWidth={18} strokeLinecap="round" />
        <m.path
          d={PATH}
          pathLength={1}
          stroke={`url(#rl-${id})`}
          strokeWidth={18}
          strokeLinecap="round"
          strokeDasharray="0.3 0.7"
          initial={{ strokeDashoffset: 1 }}
          animate={reduce ? { strokeDashoffset: 1 } : { strokeDashoffset: [1, 0] }}
          transition={reduce ? { duration: 0 } : { duration: 1.6, ease: "linear", repeat: Infinity }}
        />
      </svg>
    </span>
  );
}
