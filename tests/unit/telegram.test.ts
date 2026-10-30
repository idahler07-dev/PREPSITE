import { createHash, createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyTelegramLogin } from "@/lib/telegram";

const TOKEN = "123456:TEST-TOKEN";

function sign(data: Record<string, string | number>) {
  const check = Object.keys(data)
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join("\n");
  const secret = createHash("sha256").update(TOKEN).digest();
  return { ...data, hash: createHmac("sha256", secret).update(check).digest("hex") };
}

describe("Telegram login verification", () => {
  const now = Date.UTC(2026, 9, 29, 12, 0, 0);
  const authDate = Math.floor(now / 1000) - 60;

  it("accepts a correctly signed payload", () => {
    const payload = sign({ id: 42, first_name: "Aziza", username: "aziza", auth_date: authDate });
    expect(verifyTelegramLogin(payload, TOKEN, { now })).toEqual({ id: "42", firstName: "Aziza", lastName: undefined, username: "aziza", photoUrl: undefined });
  });

  it("rejects a tampered payload", () => {
    const payload = sign({ id: 42, first_name: "Aziza", auth_date: authDate });
    expect(verifyTelegramLogin({ ...payload, id: 43 }, TOKEN, { now })).toBeNull();
  });

  it("rejects a payload signed with another bot's token", () => {
    const payload = sign({ id: 42, auth_date: authDate });
    expect(verifyTelegramLogin(payload, "999:OTHER", { now })).toBeNull();
  });

  it("rejects an old login", () => {
    const payload = sign({ id: 42, auth_date: authDate - 2 * 86400 });
    expect(verifyTelegramLogin(payload, TOKEN, { now })).toBeNull();
  });

  it("rejects missing fields and ignores non-https photos", () => {
    expect(verifyTelegramLogin({ id: 1 } as never, TOKEN, { now })).toBeNull();
    const payload = sign({ id: 7, photo_url: "http://t.me/x.jpg", auth_date: authDate });
    expect(verifyTelegramLogin(payload, TOKEN, { now })?.photoUrl).toBeUndefined();
  });
});
