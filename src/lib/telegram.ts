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
}

export interface TelegramUser {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
}

const ALLOWED_KEYS = ["id", "first_name", "last_name", "username", "photo_url", "auth_date"] as const;

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

  const checkString = ALLOWED_KEYS.filter((k) => data[k] !== undefined && data[k] !== null && data[k] !== "")
    .sort()
    .map((k) => `${k}=${data[k]}`)
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
