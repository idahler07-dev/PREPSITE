import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

const OUTBOX = path.join(process.cwd(), ".data", "dev-mail");

/** Read the newest sign-in email for `email` from the dev outbox. */
async function latestSignInMail(email: string, since: number) {
  const safe = email.replace(/[^a-z0-9@._-]/gi, "_");
  let mail: { text: string } | undefined;
  await expect
    .poll(
      () => {
        if (!existsSync(OUTBOX)) return false;
        const file = readdirSync(OUTBOX)
          .filter((f) => f.endsWith(`-${safe}.json`) && Number(f.split("-")[0]) >= since)
          .sort()
          .at(-1);
        if (file) mail = JSON.parse(readFileSync(path.join(OUTBOX, file), "utf8")) as { text: string };
        return !!mail;
      },
      { timeout: 15_000 },
    )
    .toBe(true);
  return { code: mail!.text.match(/^\d{6}$/m)?.[0], link: mail!.text.match(/https?:\/\/\S+/)?.[0] };
}

/**
 * Sign in through the real email flow, reading the email from the dev outbox:
 * by typing the 6-digit code (default) or by opening the link.
 */
export async function signIn(page: Page, email: string, via: "code" | "link" = "code") {
  const since = Date.now() - 1000;
  await page.goto("/en/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Continue with email" }).click();
  await expect(page.getByLabel("Sign-in code")).toBeVisible();

  const { code, link } = await latestSignInMail(email, since);
  if (via === "link") await page.goto(link!);
  // Typing the sixth digit submits the form.
  else await page.getByLabel("Sign-in code").fill(code!);
  await expect(page).not.toHaveURL(/\/login/);
}

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@e2e.test`;
}
