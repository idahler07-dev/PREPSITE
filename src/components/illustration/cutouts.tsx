"use client";

import { m } from "motion/react";
import { useReducedMotionSafe } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Decorative paper cutouts for panel corners and section edges: a quarter
 * circle, a wavy strip and a dotted arc, lifted by the same cut shadow as
 * the illustrations. Four arrangements so neighbouring panels differ.
 * Purely decorative; they drift very slightly.
 */
export function Cutouts({ variant = 0, className }: { variant?: 0 | 1 | 2 | 3; className?: string }) {
  const reduce = useReducedMotionSafe();
  const drift = (d: number) => (reduce ? {} : { animate: { y: [0, -3, 0] }, transition: { duration: 6 + d, repeat: Infinity, ease: "easeInOut" as const, delay: d } });
  const shadow = "drop-shadow(0 3px 2px var(--ill-shadow))";
  const corners = [
    { q: "top-0 right-0", qr: "rotate-0", w: "bottom-8 left-0", a: "top-6 left-8" },
    { q: "bottom-0 left-0", qr: "rotate-180", w: "top-8 right-0", a: "bottom-8 right-10" },
    { q: "top-0 left-0", qr: "-rotate-90", w: "bottom-10 right-0", a: "top-8 right-10" },
    { q: "bottom-0 right-0", qr: "rotate-90", w: "top-10 left-0", a: "bottom-8 left-10" },
  ][variant]!;
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {/* Quarter circle in the corner */}
      <m.svg {...drift(0)} viewBox="0 0 80 80" className={cn("absolute size-20", corners.q, corners.qr)} style={{ filter: shadow }}>
        <path d="M80 0V80A80 80 0 0 1 0 0Z" fill="var(--ill-c)" opacity={0.55} />
      </m.svg>
      {/* Wavy paper strip along an edge */}
      <m.svg {...drift(1.5)} viewBox="0 0 140 28" className={cn("absolute h-7 w-36", corners.w)} style={{ filter: shadow }}>
        <path d="M0 14C18 2 28 2 46 14S74 26 92 14S120 2 140 14V28H0Z" fill="var(--ill-b)" opacity={0.35} />
      </m.svg>
      {/* Dotted arc */}
      <svg viewBox="0 0 60 30" className={cn("absolute h-6 w-12", corners.a)}>
        <path d="M2 28A28 28 0 0 1 58 28" fill="none" stroke="var(--ill-a)" strokeWidth={2.5} strokeDasharray="0.5 7" strokeLinecap="round" opacity={0.7} />
      </svg>
    </div>
  );
}
