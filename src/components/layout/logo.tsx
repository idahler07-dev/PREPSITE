import siteConfig from "@site";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Full logo: the owl's head + "satify" in Plus Jakarta Sans ExtraBold.
 * `compact` shows the owl only. The owl blinks now and then (SVG-internal,
 * stops with reduced motion).
 */
export function Logo({ className, href = "/", compact = false }: { className?: string; href?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-[0.3em] rounded-md text-[1.4rem] leading-none", className)} aria-label={siteConfig.name}>
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG; next/image adds nothing here */}
      <img
        src="/mascot/owl-happy.svg"
        alt=""
        width={300}
        height={250}
        className={cn("h-auto transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] motion-safe:group-hover:-rotate-6", compact ? "w-9" : "w-[1.45em]")}
      />
      {!compact && (
        <span className="font-display font-extrabold tracking-[-0.03em] text-primary" aria-hidden>
          {siteConfig.name.toLowerCase()}
        </span>
      )}
    </Link>
  );
}
