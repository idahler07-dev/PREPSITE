/** Notification kinds, channels and their defaults. Students change them in Settings. */
export const NOTIFICATION_KINDS = ["study", "streak", "newTests", "renewals"] as const;
export const NOTIFICATION_CHANNELS = ["email", "telegram"] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
export type NotificationPrefs = Record<NotificationChannel, Record<NotificationKind, boolean>>;

export const DEFAULT_PREFS: NotificationPrefs = {
  email: { study: false, streak: true, newTests: true, renewals: true },
  telegram: { study: true, streak: true, newTests: true, renewals: true },
};

/** Evening reminders go out at this hour (site time zone) to students who haven't practised today. */
export const EVENING_REMINDER_CRON = "47 18 * * *";

export function resolvePrefs(stored: unknown): NotificationPrefs {
  const s = (stored ?? {}) as Partial<Record<string, Partial<Record<string, unknown>>>>;
  const out = structuredClone(DEFAULT_PREFS);
  for (const ch of NOTIFICATION_CHANNELS) for (const k of NOTIFICATION_KINDS) if (typeof s[ch]?.[k] === "boolean") out[ch][k] = s[ch]![k] as boolean;
  return out;
}
