import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Every API route and server action must check who is calling. This test
 * fails when a new one is added without a guard, so the check can't be
 * forgotten. Exceptions are listed with the reason.
 */
function files(dir: string, name: RegExp): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? files(p, name) : name.test(f) ? [p] : [];
  });
}

const GUARDS = /requireApiUser\(|requireApiRole\(|requireRole\(|requireUser\(|getCurrentUser\(\)/;
const ROUTE_EXCEPTIONS: Record<string, { pattern: RegExp; why: string }> = {
  "src/app/api/auth/[...nextauth]/route.ts": { pattern: /handlers/, why: "Auth.js itself" },
  "src/app/api/jobs/run/route.ts": { pattern: /CRON_SECRET/, why: "cron, Bearer secret" },
  "src/app/api/payments/[provider]/webhook/route.ts": { pattern: /handleWebhook/, why: "providers verify their own signature/credentials" },
};

describe("authorization guards", () => {
  const routes = files("src/app/api", /^route\.ts$/);

  it.each(routes)("%s checks the caller", (file) => {
    const src = readFileSync(file, "utf8");
    const exception = ROUTE_EXCEPTIONS[file.split(path.sep).join("/")];
    if (exception) expect(src).toMatch(exception.pattern);
    else expect(src).toMatch(GUARDS);
  });

  it("state-changing routes check the request origin (CSRF)", () => {
    for (const file of routes) {
      const src = readFileSync(file, "utf8");
      const name = file.split(path.sep).join("/");
      if (ROUTE_EXCEPTIONS[name] || !/export (async function|const) (POST|PUT|PATCH|DELETE)\b/.test(src)) continue;
      expect(src, name).toMatch(/assertSameOrigin\(/);
    }
  });

  const actions = files("src/server/actions", /\.ts$/);
  it.each(actions)("every exported server action in %s checks the caller", (file) => {
    const src = readFileSync(file, "utf8");
    const exported = [...src.matchAll(/export async function (\w+)\([^)]*\)[^{]*\{([\s\S]*?)\n\}/g)];
    expect(exported.length).toBeGreaterThan(0);
    for (const [, name, body] of exported) {
      // Some actions are allowed for visitors (sign-in, language), and say so.
      if (/\/\/ public:|signIn\(|saveLocalePreference|saveThemePreference/.test(body!) || /^(sendMagicLink|telegramLogin|signOutAction|saveLocalePreference|saveThemePreference)$/.test(name!)) continue;
      expect(body, `${file}: ${name}`).toMatch(GUARDS);
    }
  });
});
