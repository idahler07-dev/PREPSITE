import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CoverageMark {
  label: string;
  icon: LucideIcon;
}

/**
 * The homepage marquee: what Satify covers, as quiet monochrome marks
 * (icon + word), one slow row that pauses on hover and fades at both edges.
 * There are no partner logos here on purpose: none are cleared for use, and
 * we don't imply partnerships. Static and scrollable with reduced motion.
 */
export function CoverageMarquee({ items, seconds = 70, className, label }: { items: CoverageMark[]; seconds?: number; className?: string; label: string }) {
  const row = (hidden: boolean) => (
    <ul className="marquee__track items-center" aria-hidden={hidden || undefined} style={{ animationDuration: `${seconds}s`, ["--gap" as string]: "3.5rem" }}>
      {items.map((it) => (
        <li key={it.label} className="flex shrink-0 items-center gap-2.5 font-display text-[17px] font-bold tracking-tight whitespace-nowrap text-muted-foreground/80 transition-colors hover:text-foreground">
          <it.icon className="size-5 text-brand-a" strokeWidth={2} aria-hidden />
          {it.label}
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label={label} className={cn("marquee py-6 [--gap:3.5rem]", className)}>
      {row(false)}
      {row(true)}
    </section>
  );
}
