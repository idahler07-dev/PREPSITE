import siteConfig from "@site";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { AppMark, Wordmark } from "@/components/brand/antler-w";

/** The WilloPrep logo: the wordmark with the antler W. `compact` shows the app mark only. */
export function Logo({ className, href = "/", compact = false }: { className?: string; href?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center rounded-md text-[1.45rem] leading-none", className)} aria-label={siteConfig.name}>
      {compact ? <AppMark className="w-9" /> : <Wordmark className="transition-opacity group-hover:opacity-85" />}
    </Link>
  );
}
