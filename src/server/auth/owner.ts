import "server-only";
import { env } from "@/lib/env";

/**
 * Owners manage content (questions, imports, mocks, users, orders). There are
 * no roles: a user is an owner when their email is listed in OWNER_EMAILS and
 * they have proved they own it (email code/link, or a Google-verified address).
 */
export function isOwner(user: { email: string | null; emailVerified: Date | null } | null | undefined): boolean {
  if (!user?.email || !user.emailVerified) return false;
  const email = user.email.toLowerCase();
  return env().OWNER_EMAILS.some((x) => x.toLowerCase() === email);
}
