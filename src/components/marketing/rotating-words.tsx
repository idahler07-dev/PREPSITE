"use client";

import { useReducedMotion } from "motion/react";
import TextRotate from "@/components/fx/text-rotate";

/** Words that swap letter by letter inside a cobalt pill (fancy text-rotate). Reduced motion: the first word, still. */
export function RotatingWords({ words }: { words: string[] }) {
  const reduce = useReducedMotion();
  const pill = "inline-flex overflow-hidden rounded-xl bg-primary px-3 py-0.5 text-primary-foreground sm:px-4";
  if (reduce) return <span className={pill}>{words[0]}</span>;
  return (
    <span className="inline-flex align-bottom" aria-live="off">
      <span className="sr-only">{words.join(", ")}</span>
      <span aria-hidden>
        <TextRotate
          texts={words}
          as="span"
          mainClassName={`${pill} justify-center`}
          staggerFrom="last"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-120%" }}
          staggerDuration={0.025}
          splitLevelClassName="overflow-hidden pb-0.5"
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          rotationInterval={2400}
        />
      </span>
    </span>
  );
}
