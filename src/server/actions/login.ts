"use server";

import { createHash } from "node:crypto";
import { env } from "@/lib/env";
import { z } from "zod";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
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
  const byIp = await rateLimit(`magic-link:ip:${ip}`, env().MAGIC_LINKS_PER_IP_HOUR, 3600);
  if (!byIp.ok) return { error: "RateLimited", email };

  const next = safeNextPath(parsed.data.next);
  try {
    await signIn("email", { email, redirect: false, redirectTo: `/api/post-login?next=${encodeURIComponent(next ?? "")}` });
  } catch (e) {
    if (e instanceof AuthError) return { error: e.type === "EmailSignInError" ? "EmailSignin" : "Default", email };
    throw e;
  }
  return { email };
}

export type CodeState = { error?: string; redirectTo?: string };

const codeSchema = z.object({ email: z.email().max(254), code: z.string().regex(/^\d{6}$/), next: z.string().optional() });

/** Wrong guesses allowed per email per hour, before a new code is needed. */
const CODE_ATTEMPTS_PER_HOUR = 8;

/**
 * Check a 6-digit email code and return Auth.js's email callback URL (the same
 * URL as the link in the email). The browser opens it once, which uses up the
 * token and signs in; a server-side redirect() would make the router request it twice.
 */
export async function verifyEmailCode(_prev: CodeState, form: FormData): Promise<CodeState> {
  // public: signing in; guesses are rate-limited per email below.
  const parsed = codeSchema.safeParse({
    email: String(form.get("email") ?? "").trim().toLowerCase(),
    code: String(form.get("code") ?? "").replace(/\D/g, ""),
    next: form.get("next") ?? undefined,
  });
  if (!parsed.success) return { error: "WrongCode" };
  const { email, code } = parsed.data;

  if (!(await rateLimit(`email-code:check:${email}`, CODE_ATTEMPTS_PER_HOUR, 3600)).ok) return { error: "RateLimited" };
  // Auth.js stores sha256(token + secret); the email provider's secret is AUTH_SECRET.
  const token = createHash("sha256").update(`${code}${env().AUTH_SECRET}`).digest("hex");
  const found = await db.verificationToken.findFirst({ where: { identifier: email, token, expires: { gt: new Date() } }, select: { token: true } });
  if (!found) return { error: "WrongCode" };

  const next = safeNextPath(parsed.data.next);
  const callbackUrl = `/api/post-login?next=${encodeURIComponent(next ?? "")}`;
  return { redirectTo: `/api/auth/callback/email?${new URLSearchParams({ callbackUrl, token: code, email })}` };
}

export async function signInWithGoogle(form: FormData) {
  const next = safeNextPath(String(form.get("next") ?? ""));
  await signIn("google", { redirectTo: `/api/post-login?next=${encodeURIComponent(next ?? "")}` });
}

export async function signInWithTelegram(payload: string, nextRaw?: string): Promise<{ error?: string; redirectTo?: string }> {
  const ip = await clientIp();
  if (!(await rateLimit(`telegram-login:ip:${ip}`, 20, 3600)).ok) return { error: "RateLimited" };
  const next = safeNextPath(nextRaw);
  try {
    await signIn("telegram", { payload, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) return { error: "CredentialsSignin" };
    throw e;
  }
  return { redirectTo: `/api/post-login?next=${encodeURIComponent(next ?? "")}` };
}

/** Demo site only (DEMO_MODE): sign in as a demo student or the demo admin. */
export async function signInAsDemo(form: FormData) {
  if (!env().DEMO_MODE) return;
  const ip = await clientIp();
  if (!(await rateLimit(`demo-login:ip:${ip}`, 30, 3600)).ok) return;
  const role = form.get("role") === "admin" ? "admin" : "student";
  await signIn("demo", { role, redirectTo: role === "admin" ? "/admin" : "/dashboard" });
}
