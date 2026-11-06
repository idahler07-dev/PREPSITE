"use client";

import { type ReactNode } from "react";
import { m, type MotionProps } from "motion/react";
import { useReducedMotionSafe } from "@/lib/motion";

/**
 * Satify illustration kit: shared rules for every scene so the style stays
 * consistent.
 *  - Outlines: one ink weight (STROKE), round joins.
 *  - Radii: R.sm 6, R.md 12, R.lg 20 (in SVG units of a 400×300 scene).
 *  - Depth: 2–3 paper layers, each lifted by the same crisp cut shadow.
 *  - Texture: one faint grain, applied once per scene.
 *  - Colour: only the --ill-* tokens.
 */
export const STROKE = 2.5;
export const R = { sm: 6, md: 12, lg: 20 } as const;
export const INK = "var(--ill-ink)";
export const PAPER = "var(--ill-paper)";
export const PAPER2 = "var(--ill-paper-2)";
export const A = "var(--ill-a)";
export const B = "var(--ill-b)";
export const C = "var(--ill-c)";
export const WARM = "var(--ill-warm)";

/** Filters shared by a scene: the paper-cut lift and the grain. */
export function SceneDefs({ id }: { id: string }) {
  return (
    <defs>
      <filter id={`cut-${id}`} x="-10%" y="-10%" width="130%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="1.6" floodColor="var(--ill-shadow)" floodOpacity="1" />
      </filter>
      <filter id={`grain-${id}`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.09 0" />
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
    </defs>
  );
}

/** A layer of paper: everything inside gets the same cut shadow; slides up into place when shown. */
export function Layer({ id, depth = 0, show = true, children, ...rest }: { id: string; depth?: 0 | 1 | 2; show?: boolean; children: ReactNode } & MotionProps) {
  const reduce = useReducedMotionSafe();
  return (
    <m.g
      filter={`url(#cut-${id})`}
      initial={reduce ? false : { opacity: 0, y: 14 + depth * 6 }}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 + depth * 6 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.12 * depth }}
      {...rest}
    >
      {children}
    </m.g>
  );
}

/** Gentle idle float for one element in a scene (still under reduced motion). */
export function Float({ children, amount = 4, duration = 4.5, delay = 0, rotate = 0 }: { children: ReactNode; amount?: number; duration?: number; delay?: number; rotate?: number }) {
  const reduce = useReducedMotionSafe();
  return (
    <m.g
      animate={reduce ? undefined : { y: [0, -amount, 0], rotate: rotate ? [0, rotate, 0] : 0 }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
    >
      {children}
    </m.g>
  );
}

/** The faint paper grain laid over a whole scene. */
export function Grain({ id, w, h }: { id: string; w: number; h: number }) {
  return <rect width={w} height={h} fill="white" filter={`url(#grain-${id})`} style={{ mixBlendMode: "multiply" }} opacity={0.9} />;
}
