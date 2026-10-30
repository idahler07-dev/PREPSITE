"use client";

import { useId, useState } from "react";
import { AnimatePresence, LayoutGroup, m, useReducedMotion } from "motion/react";
import { Plus } from "lucide-react";
import { fade, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** FAQ accordion: open/close with layout animation, so nothing below jumps. */
export function FaqList({ items, className }: { items: { q: string; a: string }[]; className?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();
  const id = useId();
  const t = reduce ? { duration: 0 } : spring.soft;
  return (
    <LayoutGroup>
      <m.ul layout transition={t} className={cn("divide-y overflow-hidden rounded-lg border bg-surface shadow-sm", className)}>
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <m.li key={item.q} layout="position" transition={t}>
              <h3>
                <button
                  type="button"
                  id={`${id}-q${i}`}
                  aria-expanded={isOpen}
                  aria-controls={`${id}-a${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start font-semibold transition-colors hover:bg-surface-2/60 focus-visible:bg-surface-2 focus-visible:outline-none"
                >
                  {item.q}
                  <m.span animate={{ rotate: isOpen ? 45 : 0 }} transition={reduce ? { duration: 0 } : spring.snappy} className="shrink-0 text-muted-foreground">
                    <Plus className="size-5" aria-hidden />
                  </m.span>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <m.div
                    id={`${id}-a${i}`}
                    role="region"
                    aria-labelledby={`${id}-q${i}`}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: fade }}
                    transition={reduce ? fade : spring.soft}
                  >
                    <p className="max-w-[70ch] px-5 pb-5 text-muted-foreground">{item.a}</p>
                  </m.div>
                )}
              </AnimatePresence>
            </m.li>
          );
        })}
      </m.ul>
    </LayoutGroup>
  );
}
