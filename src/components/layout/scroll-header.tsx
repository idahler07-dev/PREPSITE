"use client";

import type { ReactNode } from "react";
import { m, useReducedMotion, useScroll, useTransform } from "motion/react";

/**
 * Sticky marketing bar: as you scroll, a blurred surface and border fade in
 * and the row tightens slightly (transform/opacity only, no layout changes).
 */
export function ScrollHeader({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const backdrop = useTransform(scrollY, [0, 48], [0, 1]);
  const y = useTransform(scrollY, [0, 48], [0, reduce ? 0 : -6]);
  const scale = useTransform(scrollY, [0, 48], [1, reduce ? 1 : 0.97]);
  return (
    <header className="sticky top-0 z-40 h-16">
      <m.div aria-hidden className="glass absolute inset-0 border-b" style={{ opacity: backdrop, y }} />
      <m.div className="relative h-full" style={{ y, scale }}>
        {children}
      </m.div>
    </header>
  );
}
