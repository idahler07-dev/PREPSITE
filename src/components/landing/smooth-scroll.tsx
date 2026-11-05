"use client";

import { useEffect } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Lenis smooth scrolling on marketing pages only (the app scrolls natively).
 * Off with reduced motion and on touch screens, where native scroll is better.
 */
export function SmoothScroll() {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce || window.matchMedia("(pointer: coarse)").matches) return;
    let raf = 0;
    let destroy = () => {};
    let cancelled = false;
    void import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      const lenis = new Lenis({ duration: 1.05, anchors: { offset: -72 }, wheelMultiplier: 0.95 });
      const loop = (time: number) => {
        lenis.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      destroy = () => lenis.destroy();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      destroy();
    };
  }, [reduce]);
  return null;
}
