"use client";

import { useContext, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { fade, pageVariants } from "@/lib/motion";

/**
 * Keeps showing the previous route's tree while it animates out. The App
 * Router swaps children immediately, so AnimatePresence needs the old router
 * context frozen to play an exit animation.
 */
function FrozenRouter({ children }: { children: ReactNode }) {
  const context = useContext(LayoutRouterContext);
  const frozen = useRef(context).current;
  return <LayoutRouterContext.Provider value={frozen}>{children}</LayoutRouterContext.Provider>;
}

/** Page transitions: crossfade with a 4px blur and 12px rise (spring.soft), mode="wait". */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={reduce ? { initial: { opacity: 0 }, enter: { opacity: 1, transition: fade }, exit: { opacity: 0, transition: fade } } : pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        className="flex flex-1 flex-col"
      >
        <FrozenRouter>{children}</FrozenRouter>
      </motion.div>
    </AnimatePresence>
  );
}
