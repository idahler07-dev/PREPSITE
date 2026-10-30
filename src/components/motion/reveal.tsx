"use client";

import type { ComponentProps } from "react";
import { motion, useReducedMotion } from "motion/react";
import { fade, revealChild, revealParent, revealViewport } from "@/lib/motion";

/** A section that reveals once on scroll: fade + rise + slight scale, children staggered. */
export function Reveal({ as = "div", ...props }: ComponentProps<typeof motion.div> & { as?: "div" | "section" | "ul" | "ol" }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] as typeof motion.div;
  return <Tag initial="hidden" whileInView="shown" viewport={revealViewport} variants={reduce ? undefined : revealParent} {...props} />;
}

/** A staggered child of <Reveal>. */
export function RevealItem({ as = "div", ...props }: ComponentProps<typeof motion.div> & { as?: "div" | "li" | "article" }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] as typeof motion.div;
  return <Tag variants={reduce ? { hidden: { opacity: 0 }, shown: { opacity: 1, transition: fade } } : revealChild} {...props} />;
}
