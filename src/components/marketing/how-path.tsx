"use client";

import { motion, useReducedMotion } from "motion/react";
import { CalendarDays, Stethoscope, Zap } from "lucide-react";
import { spring } from "@/lib/motion";

const ICONS = [Stethoscope, CalendarDays, Zap];

/** Diagnose → Plan → Practice as a connected path; the line draws itself on scroll. */
export function HowPath({ steps }: { steps: { title: string; body: string }[] }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative">
      <svg aria-hidden className="absolute top-8 left-[16%] hidden h-4 w-[68%] overflow-visible lg:block" viewBox="0 0 100 4" preserveAspectRatio="none">
        <motion.path
          d="M0 2 L 100 2"
          fill="none"
          strokeWidth={2.5}
          vectorEffect="non-scaling-stroke"
          className="stroke-primary"
          initial={reduce ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-20% 0px" }}
          transition={{ ...spring.soft, stiffness: 40 }}
        />
      </svg>
      <ol className="relative grid gap-10 lg:grid-cols-3 lg:gap-8">
        {steps.map((s, i) => {
          const Icon = ICONS[i] ?? Zap;
          return (
            <motion.li
              key={s.title}
              className="flex gap-5 lg:flex-col lg:items-center lg:text-center"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={reduce ? { duration: 0.2 } : { ...spring.soft, delay: 0.15 + i * 0.25 }}
            >
              <span className="relative flex size-16 shrink-0 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-md">
                <Icon className="size-7" aria-hidden />
              </span>
              <div className="space-y-2">
                <h3 className="text-h3 font-semibold">{s.title}</h3>
                <p className="max-w-[34ch] text-muted-foreground">{s.body}</p>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
