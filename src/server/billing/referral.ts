import "server-only";
import { randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { newReferralCode, REF_COOKIE, REF_PATTERN } from "@/lib/billing/referral-code";

/** The user's own code to share (created on first use). */
export async function ensureReferralCode(userId: string): Promise<string> {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { referralCode: true } });
  if (user.referralCode) return user.referralCode;
  for (let i = 0; i < 5; i++) {
    const code = newReferralCode(randomInt);
    try {
      const r = await db.user.updateMany({ where: { id: userId, referralCode: null }, data: { referralCode: code } });
      if (r.count) return code;
      return (await db.user.findUniqueOrThrow({ where: { id: userId }, select: { referralCode: true } })).referralCode!;
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e;
    }
  }
  throw new Error("Could not create a referral code");
}

/** Link a brand-new account to whoever referred it (from the ?ref= cookie). */
export async function applyReferral(userId: string, code: string | undefined) {
  if (!code || !REF_PATTERN.test(code)) return;
  const referrer = await db.user.findUnique({ where: { referralCode: code }, select: { id: true } });
  if (!referrer || referrer.id === userId) return;
  await db.user.updateMany({ where: { id: userId, referredById: null }, data: { referredById: referrer.id } });
}

export async function applyReferralFromCookie(userId: string) {
  try {
    await applyReferral(userId, (await cookies()).get(REF_COOKIE)?.value);
  } catch (e) {
    console.warn("[referral]", e);
  }
}
