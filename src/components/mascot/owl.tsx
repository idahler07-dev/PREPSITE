"use client";

import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * The Satify owl. Four poses, drawn as static SVGs in /public/mascot (each
 * blinks on its own; the blink stops under reduced motion). Here it bobs
 * gently (2.6s) and squashes-and-stretches when the pose changes.
 *
 * Use it at key moments only, and never more than one owl on screen.
 */
export type OwlPose = "happy" | "correct" | "oops" | "thinking";

export const OWL_POSES: OwlPose[] = ["happy", "correct", "oops", "thinking"];

/** The art is 300×250; height follows width. */
const RATIO = 250 / 300;

export function Owl({
  pose = "happy",
  size,
  className,
  label,
  bob = true,
}: {
  pose?: OwlPose;
  /** Width in px. Leave out to size it with className (e.g. `w-24`). */
  size?: number;
  className?: string;
  /** Accessible name. Without it the owl is decorative. */
  label?: string;
  bob?: boolean;
}) {
  const reduce = useReducedMotion();
  const animateBob = bob && !reduce;
  return (
    <m.span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("relative inline-block w-24 shrink-0 select-none", className)}
      style={size ? { width: size } : undefined}
      animate={animateBob ? { y: [0, -4, 0] } : undefined}
      transition={animateBob ? { duration: 2.6, repeat: Infinity, ease: "easeInOut" } : undefined}
    >
      <span className="block w-full" style={{ paddingBottom: `${RATIO * 100}%` }} />
      <AnimatePresence initial={false}>
        <m.img
          key={pose}
          src={`/mascot/owl-${pose}.svg`}
          alt=""
          width={300}
          height={250}
          draggable={false}
          decoding="async"
          className="absolute inset-0 block h-full w-full overflow-visible"
          style={{ transformOrigin: "50% 100%" }}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scaleX: 1.14, scaleY: 0.84 }}
          animate={{ opacity: 1, scaleX: 1, scaleY: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
          transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 520, damping: 14, opacity: { duration: 0.12 } }}
        />
      </AnimatePresence>
    </m.span>
  );
}
