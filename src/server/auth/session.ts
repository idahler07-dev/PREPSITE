import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "@/i18n/navigation";
import type { Role } from "@/generated/prisma/client";
import { HttpError } from "@/server/http";

const userSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  role: true,
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

export const STAFF_ROLES: readonly Role[] = ["EDITOR", "ADMIN"];

export function isStaff(user: { role: Role } | null | undefined): boolean {
  return !!user && STAFF_ROLES.includes(user.role);
}

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

/** For pages: 404 unless the user has one of the roles (hides admin pages entirely). */
export async function requireRole(roles: readonly Role[], nextPath?: string): Promise<CurrentUser> {
  const user = await requireUser(nextPath);
  if (!roles.includes(user.role)) notFound();
  return user;
}

/** For route handlers and server actions. */
export async function requireApiUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "UNAUTHORIZED");
  return user;
}

export async function requireApiRole(roles: readonly Role[]): Promise<CurrentUser> {
  const user = await requireApiUser();
  if (!roles.includes(user.role)) throw new HttpError(403, "FORBIDDEN");
  return user;
}
