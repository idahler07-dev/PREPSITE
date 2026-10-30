/**
 * Navigation helpers with the API components already use. URLs have no locale
 * prefix, so these are thin wrappers around Next.js's own Link and router.
 */
import { redirect as nextRedirect } from "next/navigation";

export { default as Link } from "next/link";
export { usePathname, useRouter } from "next/navigation";

type Href = string | { pathname: string; query?: Record<string, string> };

function toPath(href: Href): string {
  if (typeof href === "string") return href;
  const q = href.query ? `?${new URLSearchParams(href.query)}` : "";
  return `${href.pathname}${q}`;
}

/** Same shape as next-intl's redirect ({ href, locale }); the locale is ignored. */
export function redirect({ href }: { href: Href; locale?: string }): never {
  return nextRedirect(toPath(href));
}

export function getPathname({ href }: { href: Href; locale?: string }): string {
  return toPath(href);
}
