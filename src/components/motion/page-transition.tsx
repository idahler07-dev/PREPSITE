"use client";

import { type ReactNode } from "react";
import { m, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { fade, pageVariants } from "@/lib/motion";

/**
 * Page transitions: each new route fades in with a 4px blur and 12px rise
 * (spring.soft). Enter only: an exit animation needs the old router context
 * frozen, and a frozen context can catch a route mid-stream (its loading
 * skeleton) and never show the page.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  return (
    <m.div key={pathname} variants={reduce ? { initial: { opacity: 0 }, enter: { opacity: 1, transition: fade } } : pageVariants} initial="initial" animate="enter" className="flex flex-1 flex-col">
      {children}
    </m.div>
  );
}
