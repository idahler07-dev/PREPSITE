import type { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";
import { rateLimit } from "@/server/rate-limit";

export const { POST } = handlers;

/** Email tokens are 6-digit codes, so opening the callback URL directly is capped per email. */
export async function GET(req: NextRequest) {
  if (req.nextUrl.pathname.endsWith("/callback/email")) {
    const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase() || "-";
    if (!(await rateLimit(`email-code:use:${email}`, 10, 3600)).ok) {
      return Response.redirect(new URL("/login?error=RateLimited", req.nextUrl.origin), 303);
    }
  }
  return handlers.GET(req);
}
