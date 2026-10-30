import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/** Data the Telegram Login Widget passes to the site. */
export interface TelegramAuthData {
  id: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number | string;
  hash: string;
  /** Telegram may send more fields; they are part of the signature. */
  [field: string]: unknown;
}

export interface TelegramUser {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
}

/**
 * Verify a Telegram Login Widget payload.
 * https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramLogin(
  data: Partial<TelegramAuthData>,
  botToken: string,
  { maxAgeSec = 86400, now = Date.now() } = {},
): TelegramUser | null {
  if (!data || typeof data.hash !== "string" || data.id == null || data.auth_date == null) return null;

  // Telegram signs every field it sends (not only the documented ones), so all but `hash` go in.
  const fields = Object.entries(data as Record<string, unknown>).filter(([k, v]) => k !== "hash" && v !== undefined && v !== null && v !== "");
  if (fields.some(([, v]) => typeof v !== "string" && typeof v !== "number" && typeof v !== "boolean")) return null;
  const checkString = fields
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${String(v)}`)
    .join("\n");

  const secret = createHash("sha256").update(botToken).digest();
  const expected = createHmac("sha256", secret).update(checkString).digest("hex");

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(data.hash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const authDate = Number(data.auth_date);
  if (!Number.isFinite(authDate) || now / 1000 - authDate > maxAgeSec) return null;

  return {
    id: String(data.id),
    firstName: data.first_name,
    lastName: data.last_name,
    username: data.username,
    photoUrl: data.photo_url?.startsWith("https://") ? data.photo_url : undefined,
  };
}
