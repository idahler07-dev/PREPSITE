"use client";

import { type ReactNode } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { fade, pageVariants } from "@/lib/motion";

/** Reduced motion: opacity only, but still clear the blur and offset the server may have rendered. */
const reducedVariants = {
  initial: { opacity: 0 },
  enter: { opacity: 1, y: 0, filter: "blur(0px)", transition: fade },
};

/**
 * Page transitions: each new route fades in with a 4px blur and 12px rise
 * (spring.soft); the first page load shows at once. Enter only: an exit
 * animation needs the old router context frozen, and a frozen context can
 * catch a route mid-stream (its loading skeleton) and never show the page.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      <m.div key={pathname} variants={reduce ? reducedVariants : pageVariants} initial="initial" animate="enter" className="flex flex-1 flex-col">
        {children}
      </m.div>
    </AnimatePresence>
  );
}
