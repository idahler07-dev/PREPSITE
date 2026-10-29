"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { getLocale } from "next-intl/server";
import { signIn } from "@/lib/auth";
import { clientIp } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { safeNextPath } from "@/lib/safe-redirect";

export type LoginState = { error?: string; email?: string };

const schema = z.object({ email: z.email().max(254), next: z.string().optional() });

export async function requestMagicLink(_prev: LoginState, form: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({ email: String(form.get("email") ?? "").trim().toLowerCase(), next: form.get("next") ?? undefined });
  if (!parsed.success) return { error: "InvalidEmail", email: String(form.get("email") ?? "") };
  const { email } = parsed.data;

  const ip = await clientIp();
  const byIp = await rateLimit(`magic-link:ip:${ip}`, 10, 3600);
  if (!byIp.ok) return { error: "RateLimited", email };

  const locale = await getLocale();
  const next = safeNextPath(parsed.data.next);
  try {
    await signIn("email", { email, redirect: false, redirectTo: `/api/post-login?locale=${locale}&next=${encodeURIComponent(next ?? "")}` });
  } catch (e) {
    if (e instanceof AuthError) return { error: e.type === "EmailSignInError" ? "EmailSignin" : "Default", email };
    throw e;
  }
  return { email };
}

export async function signInWithGoogle(form: FormData) {
  const locale = await getLocale();
  const next = safeNextPath(String(form.get("next") ?? ""));
  await signIn("google", { redirectTo: `/api/post-login?locale=${locale}&next=${encodeURIComponent(next ?? "")}` });
}

export async function signInWithTelegram(payload: string, nextRaw?: string): Promise<{ error?: string; redirectTo?: string }> {
  const ip = await clientIp();
  if (!(await rateLimit(`telegram-login:ip:${ip}`, 20, 3600)).ok) return { error: "RateLimited" };
  const locale = await getLocale();
  const next = safeNextPath(nextRaw);
  try {
    await signIn("telegram", { payload, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) return { error: "CredentialsSignin" };
    throw e;
  }
  return { redirectTo: `/api/post-login?locale=${locale}&next=${encodeURIComponent(next ?? "")}` };
}
