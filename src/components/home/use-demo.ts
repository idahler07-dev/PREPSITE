"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { useReducedMotionSafe } from "@/lib/motion";

/**
 * Drives a product demo as a sequence of steps, each held for a set time.
 * - Runs only while at least `amount` of it is on screen, and pauses when the tab is hidden.
 * - Has a real play/pause (`toggle`), so visitors control it (WCAG 2.2.2).
 * - Under reduced motion it jumps to the final step and stays there.
 * `holds` are the milliseconds to hold each step; after the last, it loops.
 */
export function useDemo(holds: number[], { amount = 0.4, loop = true }: { amount?: number; loop?: boolean } = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount });
  const reduce = useReducedMotionSafe();
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const last = holds.length - 1;

  useEffect(() => {
    const on = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  const running = inView && !paused && !hidden && !reduce;

  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => setStep((s) => (s >= last ? (loop ? 0 : s) : s + 1)), holds[step] ?? 2500);
    return () => clearTimeout(id);
  }, [running, step, holds, last, loop]);

  const toggle = useCallback(() => setPaused((p) => !p), []);
  const go = useCallback((s: number) => setStep(Math.max(0, Math.min(last, s))), [last]);

  return { ref, step: reduce ? last : step, paused, toggle, go, reduce, running, inView };
}
