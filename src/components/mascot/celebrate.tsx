"use client";

import { m, useReducedMotion } from "motion/react";
import { spring } from "@/lib/motion";
import { Mascot } from "./mascot";

/** Correct answer in a drill: Pip pops in cheering (spring.bouncy, under 1s). Not used in timed tests. */
export function MascotCheerPop() {
  const reduce = useReducedMotion();
  return (
    <m.div
      aria-hidden
      className="pointer-events-none absolute -top-10 end-3 w-16"
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.4, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={reduce ? { duration: 0.2 } : spring.bouncy}
    >
      <Mascot pose="cheer" className="w-16" />
    </m.div>
  );
}

const PARTICLES = Array.from({ length: 14 }, (_, i) => i);
const TONES = ["bg-primary", "bg-highlight", "bg-accent"];

/** Finished test / streak milestone: a short burst of cobalt, lilac and coral particles around Pip cheering. */
export function Celebration({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div className={`relative mx-auto w-32 ${className ?? ""}`} aria-hidden>
      {!reduce &&
        PARTICLES.map((i) => {
          const a = (i / PARTICLES.length) * Math.PI * 2;
          const r = 70 + (i % 3) * 14;
          return (
            <m.span
              key={i}
              className={`absolute top-1/2 left-1/2 size-2 rounded-full ${TONES[i % 3]}`}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: Math.cos(a) * r, y: Math.sin(a) * r, opacity: 0, scale: 0.6 }}
              transition={{ ...spring.bouncy, opacity: { duration: 0.4, ease: "easeOut" } }}
            />
          );
        })}
      <m.div initial={reduce ? { opacity: 0 } : { scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={reduce ? { duration: 0.2 } : spring.bouncy}>
        <Mascot pose="cheer" className="w-32" />
      </m.div>
    </div>
  );
}
