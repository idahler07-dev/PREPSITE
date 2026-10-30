"use client";

import { motion } from "motion/react";
import { Link } from "@/i18n/navigation";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Segmented control: the active pill slides between options. */
export function CurrencySwitch({ value, options, label }: { value: string; options: { value: string; label: string; href: string }[]; label: string }) {
  return (
    <div className="inline-flex rounded-full bg-surface-2 p-1" role="group" aria-label={label}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Link
            key={o.value}
            href={o.href}
            scroll={false}
            aria-current={active ? "true" : undefined}
            className={cn("relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors", active ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {active && <motion.span layoutId="currency-pill" className="absolute inset-0 rounded-full bg-surface shadow-sm dark:border" transition={spring.snappy} aria-hidden />}
            <span className="relative">{o.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
