"use client";

import type { ComponentProps } from "react";
import { m, useReducedMotion } from "motion/react";
import { fade, spring } from "@/lib/motion";

const parent = { hidden: {}, shown: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } } };
const child = { hidden: { opacity: 0, y: 14 }, shown: { opacity: 1, y: 0, transition: spring.soft } };
const childReduced = { hidden: { opacity: 0 }, shown: { opacity: 1, transition: fade } };

/** Children rise in one after another when the page opens (spring.soft, 50ms apart). Reduced motion: a short fade. */
export function Stagger(props: ComponentProps<typeof m.div>) {
  const reduce = useReducedMotion();
  return <m.div initial="hidden" animate="shown" variants={reduce ? undefined : parent} {...props} />;
}

export function StaggerItem(props: ComponentProps<typeof m.div>) {
  const reduce = useReducedMotion();
  return <m.div variants={reduce ? childReduced : child} {...props} />;
}
