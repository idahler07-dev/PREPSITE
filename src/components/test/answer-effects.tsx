"use client";

import { m, useReducedMotion } from "motion/react";
import { spring } from "@/lib/motion";

/**
 * Selected answer: a cobalt-tint fill that grows from the click point (radial
 * reveal). Render inside a `relative overflow-hidden` choice. `origin` is the
 * click position in px relative to the choice; keyboard selection grows from
 * the left edge.
 */
export function RadialFill({ origin }: { origin: { x: number; y: number } | null }) {
  const reduce = useReducedMotion();
  const x = origin?.x ?? 24;
  const y = origin?.y ?? 24;
  return (
    <m.span
      aria-hidden
      className="pointer-events-none absolute -z-0 size-[260%] rounded-full bg-primary-soft"
      style={{ left: x, top: y, translateX: "-50%", translateY: "-50%" }}
      initial={reduce ? { opacity: 0 } : { scale: 0, opacity: 1 }}
      animate={reduce ? { opacity: 1 } : { scale: 1, opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={reduce ? { duration: 0.12 } : spring.soft}
    />
  );
}

/** Correct answer: the check mark draws itself, with a soft mint glow pulse. */
export function DrawCheck({ className = "size-5" }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <span className="relative inline-flex">
      {!reduce && (
        <m.span
          aria-hidden
          className="absolute inset-[-6px] rounded-full bg-correct/40 blur-md"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 1, 0], scale: [0.6, 1.25, 1.4] }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      )}
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <m.path
          d="M5 12.5l4.5 4.5L19 7.5"
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-correct-ink"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={reduce ? { duration: 0 } : { ...spring.soft, delay: 0.05 }}
        />
      </svg>
    </span>
  );
}

/** Wrong answer: a gentle spring shake (none with reduced motion). */
export const shake = {
  animate: { x: [0, -7, 7, -4, 4, 0] },
  transition: { duration: 0.42, ease: "easeOut" as const },
};
