"use client";

import { m, useReducedMotion } from "motion/react";
import { Mascot, type MascotPose } from "./mascot";

/** Pip gently floating (404, error pages). */
export function FloatingMascot({ pose, className }: { pose: MascotPose; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <m.div animate={reduce ? undefined : { y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
      <Mascot pose={pose} className={className} />
    </m.div>
  );
}
