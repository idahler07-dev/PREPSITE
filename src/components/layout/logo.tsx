import siteConfig from "@site";
import { Link } from "@/i18n/navigation";
import { BrandStar } from "@/components/brand/star";
import { cn } from "@/lib/utils";

/** Wordmark: the star plus the name in the display font (follows the theme's colors). */
export function Logo({ className, href = "/", compact = false }: { className?: string; href?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2 rounded-md", className)} aria-label={siteConfig.name}>
      <BrandStar className="size-6 transition-transform duration-500 ease-out group-hover:rotate-45 motion-reduce:transition-none" />
      {!compact && <span className="font-display text-[1.375rem] leading-none font-semibold tracking-[-0.02em] text-foreground">{siteConfig.name}</span>}
    </Link>
  );
}
