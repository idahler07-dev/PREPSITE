import { BRAND_MARK } from "@/lib/brand-mark";
import { cn } from "@/lib/utils";

/** The app mark: cobalt rounded square with the rising "S" line (follows the theme's primary color). */
export function BrandMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8 shrink-0", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <rect width="32" height="32" rx={BRAND_MARK.radius} className="fill-primary" />
      <path d={BRAND_MARK.path} fill="none" strokeWidth={BRAND_MARK.stroke} strokeLinecap="round" strokeLinejoin="round" className="stroke-primary-foreground" />
    </svg>
  );
}
