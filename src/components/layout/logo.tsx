import siteConfig from "@site";
import { Link } from "@/i18n/navigation";
import { BrandMark } from "@/components/brand/mark";
import { cn } from "@/lib/utils";

/**
 * Full logo: Otto mark + "Satify" in Geist Bold, tracking -0.035em. Sized in em
 * from the wordmark: mark height = cap height (0.71em) × 1.3 = 0.923em, gap 0.35em.
 * `compact` shows the mark only (32px).
 */
export function Logo({ className, href = "/", compact = false }: { className?: string; href?: string; compact?: boolean }) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-[0.35em] rounded-md text-[1.5rem] leading-none", className)}
      aria-label={siteConfig.name}
    >
      <BrandMark
        className={cn(
          "transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] motion-safe:group-hover:-rotate-6",
          compact ? "size-8" : "size-[0.923em]",
        )}
      />
      {!compact && (
        <span className="font-bold tracking-[-0.035em] text-foreground" aria-hidden>
          {siteConfig.name}
        </span>
      )}
    </Link>
  );
}
