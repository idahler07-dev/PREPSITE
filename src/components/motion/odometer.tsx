"use client";

import { m, useReducedMotion } from "motion/react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * A number whose digits roll like an odometer: up from 0 on first show, and
 * to the new value when it changes (spring.soft). Screen readers get the
 * plain value. Tabular figures keep the width steady.
 */
export function Odometer({ value, className, format }: { value: number; className?: string; format?: (n: number) => string }) {
  const reduce = useReducedMotion();
  const text = format ? format(value) : String(Math.round(value));
  return (
    <span className={cn("inline-flex tabular-nums", className)} data-numeric>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline-flex overflow-hidden leading-none">
        {text.split("").map((ch, i) => {
          const d = Number(ch);
          if (Number.isNaN(d) || ch === " ") return <span key={`${i}-${ch}`}>{ch}</span>;
          // Keyed by position from the right, so changing 980 → 1010 keeps columns aligned.
          return (
            <span key={text.length - i} className="relative inline-block h-[1em] w-[1ch] overflow-hidden">
              <m.span
                className="absolute inset-x-0 top-0 flex flex-col"
                initial={reduce ? false : { y: "0em" }}
                animate={{ y: `${-d}em` }}
                transition={reduce ? { duration: 0 } : { ...spring.soft, delay: 0.03 * i }}
              >
                {DIGITS.map((n) => (
                  <span key={n} className="block h-[1em] text-center leading-none">
                    {n}
                  </span>
                ))}
              </m.span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
