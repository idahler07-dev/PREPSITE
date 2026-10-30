import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

const OUTBOX = path.join(process.cwd(), ".data", "dev-mail");

/** Sign in through the real magic-link flow, reading the email from the dev outbox. */
export async function signIn(page: Page, email: string) {
  const since = Date.now() - 1000;
  await page.goto("/en/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page).toHaveURL(/\/login\/check-email/);

  const safe = email.replace(/[^a-z0-9@._-]/gi, "_");
  let link: string | undefined;
  await expect
    .poll(
      () => {
        if (!existsSync(OUTBOX)) return false;
        const file = readdirSync(OUTBOX)
          .filter((f) => f.endsWith(`-${safe}.json`) && Number(f.split("-")[0]) >= since)
          .sort()
          .at(-1);
        if (!file) return false;
        link = (JSON.parse(readFileSync(path.join(OUTBOX, file), "utf8")) as { text: string }).text.match(/https?:\/\/\S+/)?.[0];
        return !!link;
      },
      { timeout: 15_000 },
    )
    .toBe(true);
  await page.goto(link!);
}

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@e2e.test`;
}
