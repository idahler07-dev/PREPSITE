import createIntlMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { buildCsp, originOf } from "./lib/csp";

const intl = createIntlMiddleware(routing);

export default function middleware(request: NextRequest) {
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

  const response = intl(new NextRequest(request, { headers }));
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  // Pages only: skip API routes, Next internals and files with an extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
