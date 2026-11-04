import { cn } from "@/lib/utils";

/**
 * An endless, slowly sliding row of chips (pauses on hover). Two copies of the
 * row move together so the loop has no seam; the copy is hidden from screen
 * readers. Reduced motion: still, and the row scrolls by hand.
 */
export function SkillMarquee({ items, reverse = false, seconds = 60 }: { items: { label: string; tone: "rw" | "math" }[]; reverse?: boolean; seconds?: number }) {
  const row = (hidden: boolean) => (
    <ul className="marquee__track" aria-hidden={hidden || undefined} style={{ animationDuration: `${seconds}s`, animationDirection: reverse ? "reverse" : "normal" }}>
      {items.map((it) => (
        <li key={it.label} className="glass-card flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap">
          <span className={cn("size-2 rounded-full", it.tone === "rw" ? "bg-highlight" : "bg-primary")} aria-hidden />
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
