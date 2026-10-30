"use client";

import type { ReactNode } from "react";
import { m, useReducedMotion } from "motion/react";
import { spring } from "@/lib/motion";

/**
 * <hl> emphasis: bold, with a hand-drawn lilac underline stroke that draws in
 * from left to right when the word scrolls into view. Marketing only.
 */
export function Highlight({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <span className="relative inline-block whitespace-nowrap">
      <strong className="relative z-10 font-bold">{children}</strong>
      <svg aria-hidden viewBox="0 0 200 20" preserveAspectRatio="none" className="absolute inset-x-[-0.04em] -bottom-[0.18em] h-[0.32em] w-[calc(100%+0.08em)] overflow-visible">
        <m.path
          d="M3 13 C 40 6, 90 4, 130 8 S 185 14, 197 7"
          fill="none"
          strokeWidth={7}
          strokeLinecap="round"
          className="stroke-highlight"
          vectorEffect="non-scaling-stroke"
          initial={reduce ? { opacity: 0 } : { pathLength: 0 }}
          whileInView={reduce ? { opacity: 1 } : { pathLength: 1 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={reduce ? { duration: 0.15 } : { ...spring.soft, delay: 0.3 }}
        />
      </svg>
    </span>
  );
}
