import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/auth/session";
import { isEnabledLocale } from "@/i18n/locales";
import { routing } from "@/i18n/routing";
import { safeNextPath } from "@/lib/safe-redirect";

/**
 * Every sign-in method lands here. We apply the user's saved language (or
 * save the one they signed up in) and send new users to onboarding.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const user = await getCurrentUser();
  const requested = url.searchParams.get("locale");
  const fallback = isEnabledLocale(requested) ? requested : routing.defaultLocale;
  if (!user) return NextResponse.redirect(new URL(`/${fallback}/login`, url));

  let locale = user.locale;
  if (!isEnabledLocale(locale)) {
    locale = fallback;
    await db.user.update({ where: { id: user.id }, data: { locale } });
  }

  const next = safeNextPath(url.searchParams.get("next"));
  const path = !user.onboardedAt ? "/onboarding" : (next ?? "/dashboard");
  const res = NextResponse.redirect(new URL(`/${locale}${path}`, url));
  res.cookies.set("NEXT_LOCALE", locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return res;
}
