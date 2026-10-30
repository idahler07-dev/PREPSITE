import { BRAND_MARK } from "@/lib/brand-mark";
import { cn } from "@/lib/utils";

/** App mark: white Otto (head + two curling arms) in a cobalt rounded square. */
export function BrandMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8 shrink-0", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <rect width="32" height="32" rx={BRAND_MARK.radius} className="fill-primary" />
      <path d={BRAND_MARK.head} className="fill-primary-foreground" />
      {BRAND_MARK.eyes.map((e) => (
        <circle key={e.cx} {...e} className="fill-primary" />
      ))}
      {BRAND_MARK.arms.map((d) => (
        <path key={d} d={d} fill="none" strokeWidth={BRAND_MARK.stroke} strokeLinecap="round" className="stroke-primary-foreground" />
      ))}
    </svg>
  );
}
