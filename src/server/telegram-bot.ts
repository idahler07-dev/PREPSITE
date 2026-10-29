import "server-only";
import { env } from "@/lib/env";

/**
 * Send a Telegram message from the site's bot. Works for users who signed in
 * with Telegram and allowed the bot to message them (the login widget asks).
 * Failures are logged, never thrown: messages are a courtesy, not critical.
 */
export async function sendTelegram(chatId: string, text: string): Promise<boolean> {
  const token = env().TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.warn(`[telegram] sendMessage ${res.status}`);
    return res.ok;
  } catch (e) {
    console.warn("[telegram] sendMessage failed", e);
    return false;
  }
}
