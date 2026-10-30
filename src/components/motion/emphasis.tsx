"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { spring } from "@/lib/motion";

/**
 * Lilac highlighter: a soft rounded bar behind the lower half of the word
 * that draws in from left to right when it enters the viewport.
 */
export function Highlight({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <span className="relative inline-block whitespace-nowrap">
      <motion.span
        aria-hidden
        className="absolute inset-x-[-0.08em] bottom-[0.04em] h-[0.45em] origin-left rounded-[0.18em] bg-highlight/45"
        initial={reduce ? { opacity: 0 } : { scaleX: 0 }}
        whileInView={reduce ? { opacity: 1 } : { scaleX: 1 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={reduce ? { duration: 0.15 } : { ...spring.soft, delay: 0.3 }}
      />
      <strong className="relative font-bold">{children}</strong>
    </span>
  );
}
