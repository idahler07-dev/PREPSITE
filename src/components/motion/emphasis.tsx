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

/**
 * Tags for rich text in en.json, so emphasis is chosen in one place
 * (one emphasis per marketing headline; never in tests):
 *   <i>word</i>     Instrument Serif italic, same size, primary color
 *   <hl>word</hl>   bold with the lilac highlighter
 *   <b>word</b>     bold (key numbers in stats and results)
 *   <grad>word</grad>  cobalt → coral gradient text (hero headline only)
 * Use with t.rich(key, emphasis).
 */
export const emphasis = {
  i: (chunks: ReactNode) => <em className="pe-[0.06em] font-serif text-[1.12em] leading-[0.9] font-normal tracking-normal text-primary italic">{chunks}</em>,
  hl: (chunks: ReactNode) => <Highlight>{chunks}</Highlight>,
  b: (chunks: ReactNode) => <strong className="font-bold">{chunks}</strong>,
  grad: (chunks: ReactNode) => <span className="text-gradient">{chunks}</span>,
};
