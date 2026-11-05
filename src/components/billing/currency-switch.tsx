"use client";

import { Link } from "@/i18n/navigation";
import { LiquidGroup } from "@/components/motion/liquid-group";
import { cn } from "@/lib/utils";

/** Segmented control: the highlight glides between options like liquid. */
export function CurrencySwitch({ value, options, label }: { value: string; options: { value: string; label: string; href: string }[]; label: string }) {
  return (
    <LiquidGroup activeKey={value} className="inline-flex rounded-full bg-surface-2 p-1" role="group" aria-label={label} indicatorClassName="rounded-full bg-surface shadow-sm dark:border">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Link
            key={o.value}
            href={o.href}
            data-liquid-key={o.value}
            scroll={false}
            aria-current={active ? "true" : undefined}
            className={cn("relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors", active ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <span className="relative">{o.label}</span>
          </Link>
        );
      })}
    </LiquidGroup>
  );
}
