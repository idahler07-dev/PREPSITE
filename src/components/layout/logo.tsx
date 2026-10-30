import siteConfig from "@site";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  const { logo, name } = siteConfig;
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      {logo.showName ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo.mark} alt="" width={28} height={28} className="size-7 rounded-md" />
          <span className="text-lg">{name}</span>
        </>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo.light} alt={name} height={28} className="h-7 w-auto dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo.dark} alt={name} height={28} className="hidden h-7 w-auto dark:block" />
        </>
      )}
    </Link>
  );
}
