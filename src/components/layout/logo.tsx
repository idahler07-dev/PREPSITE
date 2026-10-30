import siteConfig from "@site";
import { Link } from "@/i18n/navigation";
import { BrandMark } from "@/components/brand/mark";
import { cn } from "@/lib/utils";

/**
 * Wordmark: "Satify" in Geist Bold, tight tracking; the dot of the i is a
 * cobalt circle that does a tiny upward bounce on hover. `compact` shows the mark.
 */
// The name's first "i" is drawn as a dotless ı plus a cobalt dot.
const NAME = siteConfig.name;
const I_AT = NAME.indexOf("i");
const BEFORE = I_AT >= 0 ? NAME.slice(0, I_AT) : NAME;
const AFTER = I_AT >= 0 ? NAME.slice(I_AT + 1) : "";
const DOTLESS_I = "\u0131";

export function Wordmark({
  className,
  bounce = false,
}: {
  className?: string;
  bounce?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline text-[1.375rem] leading-none font-bold tracking-[-0.04em] text-foreground",
        className,
      )}
      aria-hidden
    >
      {BEFORE}
      {I_AT >= 0 && (
        <span className="relative">
          {DOTLESS_I}
          <span
            data-logo-dot
            className={cn(
              "absolute top-[-0.02em] left-1/2 size-[0.2em] -translate-x-1/2 rounded-full bg-primary",
              "motion-safe:group-hover:animate-[logo-dot_520ms_cubic-bezier(0.34,1.6,0.64,1)]",
              bounce &&
                "motion-safe:animate-[logo-dot_520ms_cubic-bezier(0.34,1.6,0.64,1)]",
            )}
          />
        </span>
      )}
      {AFTER}
    </span>
  );
}

export function Logo({
  className,
  href = "/",
  compact = false,
}: {
  className?: string;
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 rounded-md",
        className,
      )}
      aria-label={siteConfig.name}
    >
      {compact ? <BrandMark className="size-8" /> : <Wordmark />}
    </Link>
  );
}
