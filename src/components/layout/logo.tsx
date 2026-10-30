import siteConfig from "@site";
import { Link } from "@/i18n/navigation";
import { BrandMark } from "@/components/brand/mark";
import { cn } from "@/lib/utils";

/** Full logo: Otto mark + "Satify" in Geist Bold (-0.03em). `compact` shows the mark only. */
export function Logo({ className, href = "/", compact = false }: { className?: string; href?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5 rounded-md", className)} aria-label={siteConfig.name}>
      <BrandMark className="size-8 transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] motion-safe:group-hover:-rotate-6" />
      {!compact && (
        <span className="text-[1.375rem] leading-none font-bold tracking-[-0.03em] text-foreground" aria-hidden>
          {siteConfig.name}
        </span>
      )}
    </Link>
  );
}
