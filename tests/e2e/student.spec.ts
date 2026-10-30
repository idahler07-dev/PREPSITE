import { expect, test } from "@playwright/test";
import { signIn, uniqueEmail } from "./helpers";

test("sign up → onboarding → drill → results → dashboard", async ({ page }) => {
  await signIn(page, uniqueEmail("student"));
  await expect(page).toHaveURL(/\/en\/onboarding$/);
  await page.getByLabel("Target score").fill("1400");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page).toHaveURL(/\/en\/practice$/);

  await page.getByRole("button", { name: "10 math questions" }).click();
  await expect(page).toHaveURL(/\/en\/test\//);

  for (let i = 0; i < 10; i++) {
    await expect(page.getByRole("button", { name: `Question ${i + 1} of 10` })).toBeVisible();
    if (await page.getByRole("radio").count()) await page.getByRole("radio").first().check({ force: true });
    else await page.getByLabel("Your answer").fill("1");
    await page.getByRole("button", { name: "Check answer" }).click();
    await expect(page.getByRole("status").filter({ hasText: /Correct|Incorrect/ })).toBeVisible();
    await page.getByRole("button", { name: "Next", exact: true }).click();
  }

  await expect(page.getByRole("heading", { name: "Check your work" })).toBeVisible();
  await expect(page.getByText("All questions answered")).toBeVisible();
  await page.getByRole("button", { name: "Finish drill" }).click();
  await page.getByRole("button", { name: "Submit", exact: true }).click();

  await expect(page).toHaveURL(/\/en\/attempts\//);
  await expect(page.getByRole("heading", { name: "Drill results" })).toBeVisible();
  await expect(page.getByText(/^(sample|mk)-/).first()).toBeVisible(); // question codes are shown

  await page.goto("/en/dashboard");
  const answered = page.locator("[data-slot=card]", { has: page.getByText("Questions answered", { exact: true }) });
  await expect(answered).toContainText("10");
  await expect(page.getByText("Estimate, not an official College Board score.")).toBeVisible();
});

test("answers survive a reload in the middle of a drill", async ({ page }) => {
  await signIn(page, uniqueEmail("reload"), "link");
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.goto("/en/practice");
  await page.getByRole("button", { name: "10 reading & writing questions" }).click();
  await expect(page).toHaveURL(/\/en\/test\//);
  await page.getByRole("radio", { name: "Choice C" }).check({ force: true });
  await page.getByRole("button", { name: "Mark for review" }).click();
  await expect(page.getByText("All answers saved")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("radio", { name: "Choice C" })).toBeChecked();
  await expect(page.getByRole("button", { name: "Marked for review" })).toBeVisible();
});

test("a wrong sign-in code is rejected", async ({ page }) => {
  const email = uniqueEmail("code");
  await page.goto("/en/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Continue with email" }).click();
  await expect(page.getByText(`We sent a 6-digit code to ${email}.`)).toBeVisible();
  await page.getByLabel("Sign-in code").fill("000000");
  await expect(page.getByText("That code isn’t right")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
  // "Change email" goes back to the first step.
  await page.getByRole("button", { name: "Change email" }).click();
  await expect(page.getByLabel("Email address")).toBeVisible();
});

test("students cannot open the admin area", async ({ page }) => {
  await signIn(page, uniqueEmail("nosy"));
  await page.goto("/en/admin");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  const res = await page.request.get("/api/admin/imports/template");
  expect(res.status()).toBe(403);
});

test("public pages: disclaimer and language switch", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByText("SAT® is a trademark registered by the College Board")).toBeVisible();
  await page.getByRole("combobox", { name: "Language" }).click();
  await page.getByRole("option", { name: "Русский" }).click();
  await expect(page).toHaveURL(/\/ru$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Готовьтесь к SAT");
  await page.goto("/uz/resources");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Rasmiy bepul materiallar");
});
