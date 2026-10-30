import { brandStarPath } from "@/lib/brand-star";
import { cn } from "@/lib/utils";

const PATH = brandStarPath();

/** The 8-point star mark, in the current text color (text-primary by default). */
export function BrandStar({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-6 shrink-0 text-primary", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <path fill="currentColor" fillRule="evenodd" d={PATH} />
    </svg>
  );
}
