import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "@/i18n/navigation";
import { isOwner } from "@/server/auth/owner";
import { HttpError } from "@/server/http";

export { isOwner };

const userSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  emailVerified: true,
  locale: true,
  theme: true,
  timeZone: true,
  telegramUsername: true,
  testDate: true,
  targetScore: true,
  currentScore: true,
  onboardedAt: true,
  createdAt: true,
} as const;

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof loadUser>>>;

async function loadUser(id: string) {
  return db.user.findUnique({ where: { id }, select: userSelect });
}

/** The signed-in user, freshly loaded from the database (cached per request). */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return loadUser(id);
});

/** For pages: redirect to the login page when signed out. */
export async function requireUser(nextPath?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    const locale = await getLocale();
    const query = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect({ href: `/login${query}`, locale });
  }
  return user!;
}

/** For pages: 404 unless the user is an owner (signed out included), so manage pages look like they don't exist. */
export async function requireOwner(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!isOwner(user)) notFound();
  return user!;
}

/** For route handlers and server actions. */
export async function requireApiUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "UNAUTHORIZED");
  return user;
}

/** For manage route handlers and server actions: 404 for everyone but owners (signed out included). */
export async function requireApiOwner(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!isOwner(user)) throw new HttpError(404, "NOT_FOUND");
  return user!;
}
