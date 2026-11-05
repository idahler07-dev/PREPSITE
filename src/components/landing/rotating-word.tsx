"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { spring } from "@/lib/motion";

/**
 * The hero's last word: swaps every ~2.2s with a vertical slide and blur,
 * and the slot's width springs to fit the new word. Screen readers get the
 * first word only (the parent carries the full sentence).
 */
export function RotatingWord({ words, interval = 2200 }: { words: string[]; interval?: number }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const measure = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    if (reduce || words.length < 2) return;
    const id = setInterval(() => setI((v) => (v + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [reduce, words.length, interval]);

  useLayoutEffect(() => {
    if (measure.current) setWidth(measure.current.getBoundingClientRect().width);
  }, [i]);

  const word = words[i] ?? "";
  return (
    <span className="relative inline-flex whitespace-nowrap">
      <span ref={measure} aria-hidden className="pointer-events-none invisible absolute whitespace-nowrap">
        {word}
      </span>
      <m.span
        aria-hidden
        className="relative inline-flex overflow-hidden pe-[0.04em] pb-[0.12em] -mb-[0.12em]"
        animate={width ? { width } : undefined}
        transition={reduce ? { duration: 0 } : spring.soft}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <m.span
            key={word}
            className="inline-block whitespace-nowrap text-primary"
            initial={reduce ? { opacity: 0 } : { y: "70%", opacity: 0, filter: "blur(10px)" }}
            animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
            exit={reduce ? { opacity: 0 } : { y: "-70%", opacity: 0, filter: "blur(10px)" }}
            transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 400, damping: 30 }}
          >
            {word}
          </m.span>
        </AnimatePresence>
      </m.span>
    </span>
  );
}
