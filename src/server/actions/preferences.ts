"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/auth/session";
import { ENABLED_LOCALES } from "@/i18n/locales";
import { NOTIFICATION_CHANNELS, NOTIFICATION_KINDS } from "@/config/notifications";

const localeSchema = z.enum(ENABLED_LOCALES);
const themeSchema = z.enum(["LIGHT", "DARK", "SYSTEM"]);

/** Remember the chosen language (cookie for everyone, profile for signed-in users). */
export async function saveLocalePreference(locale: string) {
  const parsed = localeSchema.parse(locale);
  (await cookies()).set("NEXT_LOCALE", parsed, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const user = await getCurrentUser();
  if (user) await db.user.update({ where: { id: user.id }, data: { locale: parsed } });
}

export async function saveThemePreference(theme: string) {
  const parsed = themeSchema.parse(theme.toUpperCase());
  const user = await getCurrentUser();
  if (user) await db.user.update({ where: { id: user.id }, data: { theme: parsed } });
}

const prefsSchema = z.object(
  Object.fromEntries(NOTIFICATION_CHANNELS.map((ch) => [ch, z.object(Object.fromEntries(NOTIFICATION_KINDS.map((k) => [k, z.boolean()])))])),
);

export async function saveNotificationPrefs(raw: unknown) {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const prefs = prefsSchema.parse(raw);
  await db.user.update({ where: { id: user.id }, data: { notificationPrefs: prefs } });
  return { ok: true };
}
