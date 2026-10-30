"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/auth/session";
import { NOTIFICATION_CHANNELS, NOTIFICATION_KINDS } from "@/config/notifications";

const themeSchema = z.enum(["LIGHT", "DARK", "SYSTEM"]);

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
