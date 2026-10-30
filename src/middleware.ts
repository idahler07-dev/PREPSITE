import { NextResponse, type NextRequest } from "next/server";
import { buildCsp, originOf } from "./lib/csp";
import { REF_COOKIE, REF_PATTERN } from "./lib/billing/referral-code";
import { RETIRED_LOCALE_PREFIXES } from "./i18n/locales";

// "/uz/pricing" → "/pricing": the site used to have a locale in every URL.
const LOCALE_PREFIX = new RegExp(`^/(${RETIRED_LOCALE_PREFIXES.join("|")})(?=/|$)`, "i");

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (LOCALE_PREFIX.test(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(LOCALE_PREFIX, "") || "/";
    return NextResponse.redirect(url, 308);
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce, {
    dev: process.env.NODE_ENV !== "production",
    https: (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://"),
    storageOrigin: process.env.STORAGE_DRIVER === "s3" ? originOf(process.env.S3_ENDPOINT) : undefined,
  });

  // Pass the nonce to the app (Next.js reads it from the request CSP header).
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  // Referral links (?ref=CODE): remember the code until the visitor signs up.
  const ref = request.nextUrl.searchParams.get("ref")?.toUpperCase();
  if (ref && REF_PATTERN.test(ref)) {
    response.cookies.set(REF_COOKIE, ref, { maxAge: 30 * 86_400, httpOnly: true, sameSite: "lax", path: "/", secure: request.nextUrl.protocol === "https:" });
  }
  return response;
}

export const config = {
  // Pages only: skip API routes, Next internals and files with an extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
