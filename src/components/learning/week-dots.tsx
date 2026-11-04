"use client";

import { m, useReducedMotion } from "motion/react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface WeekDay {
  /** One-letter weekday. */
  label: string;
  state: "done" | "today" | "missed" | "future";
  /** Full description for screen readers, e.g. "Monday: practised". */
  description: string;
}

/** This week, Monday to Sunday: practised days are filled, today has a ring. They pop in one after another. */
export function WeekDots({ days }: { days: WeekDay[] }) {
  const reduce = useReducedMotion();
  return (
    <ul className="mt-4 flex gap-1.5">
      {days.map((d, i) => (
        <li key={i} className="flex-1" aria-label={d.description}>
          <m.span
            aria-hidden
            initial={reduce ? false : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reduce ? { duration: 0 } : { ...spring.snappy, delay: 0.25 + i * 0.04 }}
            className={cn(
              "flex h-7 items-center justify-center rounded-lg text-[11px] font-semibold",
              d.state === "done" && "bg-gradient-to-b from-[#ffa070] to-accent text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.4)]",
              d.state === "today" && "bg-foreground/5 text-foreground ring-2 ring-primary/60",
              d.state === "missed" && "bg-foreground/[0.06] text-muted-foreground",
              d.state === "future" && "bg-foreground/[0.03] text-muted-foreground/60",
            )}
          >
            {d.label}
          </m.span>
        </li>
      ))}
    </ul>
  );
}
