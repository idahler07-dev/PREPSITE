import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MarqueeItem {
  label: string;
  icon: LucideIcon;
  tone: "rw" | "math" | "feature";
}

/**
 * University logos, for when students get in and say so. Leave empty until
 * you have permission to show each one: the row stays hidden while it's empty.
 */
export const UNIVERSITY_LOGOS: { name: string; src: string }[] = [];

const TONE = {
  rw: "bg-review-soft text-review",
  math: "bg-primary-soft text-primary",
  feature: "bg-accent-soft text-accent-ink",
} as const;

/** One endless row of chips (pauses on hover; still and hand-scrollable with reduced motion). */
export function Marquee({ items, reverse = false, seconds = 60 }: { items: MarqueeItem[]; reverse?: boolean; seconds?: number }) {
  const row = (hidden: boolean) => (
    <ul className="marquee__track" aria-hidden={hidden || undefined} style={{ animationDuration: `${seconds}s`, animationDirection: reverse ? "reverse" : "normal" }}>
      {items.map((it) => (
        <li key={it.label} className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-border bg-surface py-2 ps-2 pe-4 text-[15px] font-semibold whitespace-nowrap shadow-sm">
          <span className={cn("grid size-8 place-items-center rounded-xl", TONE[it.tone])}>
            <it.icon className="size-4" aria-hidden />
          </span>
          {it.label}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="marquee">
      {row(false)}
      {row(true)}
    </div>
  );
}
