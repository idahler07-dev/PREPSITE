"use client";

import { motion, useReducedMotion } from "motion/react";
import { Mascot, type MascotPose } from "./mascot";

/** Otto gently floating (404, error pages). */
export function FloatingOtto({ pose, className }: { pose: MascotPose; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div animate={reduce ? undefined : { y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
      <Mascot pose={pose} className={className} />
    </motion.div>
  );
}
