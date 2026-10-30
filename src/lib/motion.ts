"use client";

/**
 * Motion tokens, shared by every animation (see DESIGN.md › Motion).
 * Springs instead of fixed durations; only transform, opacity and filter are
 * animated. With prefers-reduced-motion, movement turns into short fades.
 */
import { useEffect, useState } from "react";
import { useReducedMotion, type Transition, type Variants } from "motion/react";

/**
 * Springs with a fixed visual duration, so nothing in the interface takes
 * longer than 400ms to settle (bounce only changes the feel).
 */
export const spring = {
  soft: { type: "spring", visualDuration: 0.35, bounce: 0.1 },
  snappy: { type: "spring", visualDuration: 0.25, bounce: 0.1 },
  /** Celebrations only. */
  bouncy: { type: "spring", visualDuration: 0.4, bounce: 0.35 },
} as const satisfies Record<string, Transition>;

export const ease = {
  out: [0.22, 1, 0.36, 1],
} as const;

/** A short opacity fade: what reduced motion gets instead of movement. */
export const fade: Transition = { duration: 0.15, ease: ease.out };

/** Page enter/exit: crossfade with a slight blur and 12px rise. */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12, filter: "blur(4px)" },
  enter: { opacity: 1, y: 0, filter: "blur(0px)", transition: spring.soft },
  exit: { opacity: 0, y: -6, filter: "blur(4px)", transition: { duration: 0.12, ease: ease.out } },
};

/** Scroll reveal for landing sections: fade + rise + slight scale, children staggered. */
export const revealParent: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};
export const revealChild: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  shown: { opacity: 1, y: 0, scale: 1, transition: spring.soft },
};
/** whileInView settings: once only, a little before the section is fully in view. */
export const revealViewport = { once: true, margin: "-10% 0px -10% 0px" } as const;

/** CSS easing that approximates spring.snappy, for hover/press states done in CSS. */
export const CSS_SPRING = "cubic-bezier(0.34, 1.4, 0.64, 1)";

/**
 * True on small screens and weak devices (≤4 cores or ≤4 GB memory) and with
 * reduced motion: skip tilt, parallax and blur there to keep 60fps.
 */
export function useLiteMotion(): boolean {
  const reduce = useReducedMotion();
  const [lite, setLite] = useState(true);
  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const weak = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
    const small = window.matchMedia("(max-width: 767px)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    setLite(weak || small || coarse);
  }, []);
  return !!reduce || lite;
}
