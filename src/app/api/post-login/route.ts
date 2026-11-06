import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { safeNextPath } from "@/lib/safe-redirect";

/** Every sign-in method lands here: new users go to onboarding, others to where they were going. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", url));
  const next = safeNextPath(url.searchParams.get("next"));
  return NextResponse.redirect(new URL(!user.onboardedAt ? "/onboarding" : (next ?? "/dashboard"), url));
}
