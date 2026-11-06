import siteConfig from "@site";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Spirit } from "@/components/mascot/spirit";

/**
 * Full logo: the Satify spirit (still) + "satify" in Plus Jakarta Sans
 * ExtraBold. `compact` shows the spirit only.
 */
export function Logo({ className, href = "/", compact = false }: { className?: string; href?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-[0.3em] rounded-md text-[1.4rem] leading-none", className)} aria-label={siteConfig.name}>
      <Spirit still className={cn("transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] motion-safe:group-hover:-rotate-6", compact ? "w-8" : "w-[1.2em]")} />
      {!compact && (
        <span className="font-display font-extrabold tracking-[-0.03em] text-primary" aria-hidden>
          {siteConfig.name.toLowerCase()}
        </span>
      )}
    </Link>
  );
}
