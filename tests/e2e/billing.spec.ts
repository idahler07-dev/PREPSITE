import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { signIn, uniqueEmail } from "./helpers";

test("free limit → upgrade with the test provider → premium unlocked, receipt sent", async ({ page }) => {
  const email = uniqueEmail("buyer");
  await signIn(page, email);
  await page.getByRole("button", { name: "Skip for now" }).click();

  // Two quick drills use up the 20 free questions for today; the third is refused.
  for (let i = 0; i < 2; i++) {
    await page.goto("/en/practice");
    await page.getByRole("button", { name: "10 math questions" }).click();
    await expect(page).toHaveURL(/\/en\/test\//);
  }
  await page.goto("/en/practice");
  await page.getByRole("button", { name: "10 math questions" }).click();
  await expect(page.getByText(/You've used today's free practice questions/)).toBeVisible();

  // Upgrade.
  await page.goto("/en/pricing");
  await page.getByRole("link", { name: "Choose 1 month" }).click();
  await expect(page).toHaveURL(/\/en\/checkout/);
  await expect(page.getByText("Test payment (no real money)")).toBeVisible();
  await page.getByRole("button", { name: /^Pay / }).click();
  await expect(page).toHaveURL(/\/en\/payments\/mock\//);
  await page.getByRole("button", { name: "Pay (test)" }).click();
  await expect(page.getByText("Payment received. Premium is active")).toBeVisible();

  await page.goto("/en/billing");
  await expect(page.getByText("Premium", { exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Paid" })).toBeVisible();
  await page.getByRole("link", { name: "Receipt" }).click();
  await expect(page.getByRole("heading", { name: "Receipt" })).toBeVisible();

  const outbox = path.join(process.cwd(), ".data", "dev-mail");
  const safe = email.replace(/[^a-z0-9@._-]/gi, "_");
  await expect
    .poll(() => existsSync(outbox) && readdirSync(outbox).some((f) => f.endsWith(`-${safe}.json`) && JSON.parse(readFileSync(path.join(outbox, f), "utf8")).subject.includes("payment received")))
    .toBe(true);

  // Premium: practice is no longer limited.
  await page.goto("/en/practice");
  await page.getByRole("button", { name: "10 math questions" }).click();
  await expect(page).toHaveURL(/\/en\/test\//);
});
