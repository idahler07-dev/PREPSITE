"use client";

import { motion, useReducedMotion } from "motion/react";
import { spring } from "@/lib/motion";

/**
 * Hero headline: words fade and rise in one by one (40ms stagger) on first
 * load; the emphasized phrase (<grad>…</grad> in en.json, gradient text)
 * arrives last. Screen readers get the plain sentence once.
 */
export function HeroHeadline({ raw, className }: { raw: string; className?: string }) {
  const reduce = useReducedMotion();
  const m = /^(.*?)<grad>(.*?)<\/grad>(.*)$/s.exec(raw);
  const [before, grad, after] = m ? [m[1]!, m[2]!, m[3]!] : [raw, "", ""];
  const plain = (before + grad + after).replace(/\s+/g, " ").trim();
  const words = (s: string) => s.split(/\s+/).filter(Boolean);
  const lead = [...words(before), ...words(after)];
  const word = (w: string, i: number, extra = "") => (
    <motion.span
      key={`${w}-${i}`}
      className={`inline-block ${extra}`}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={reduce ? { duration: 0.2 } : { ...spring.soft, delay: 0.1 + i * 0.04 }}
    >
      {w}
    </motion.span>
  );
  return (
    <h1 className={className}>
      <span className="sr-only">{plain}</span>
      <span aria-hidden>
        {words(before).map((w, i) => (
          <span key={`b${i}`}>
            {word(w, i)}{" "}
          </span>
        ))}
        {grad && (
          <span className="inline-block">
            {words(grad).map((w, i) => (
              <span key={`g${i}`}>
                {word(w, lead.length + 2 + i, "text-gradient pb-[0.08em]")}
                {i < words(grad).length - 1 ? " " : ""}
              </span>
            ))}
          </span>
        )}
        {words(after).map((w, i) => (
          <span key={`a${i}`}>
            {" "}
            {word(w, words(before).length + i)}
          </span>
        ))}
      </span>
    </h1>
  );
}
