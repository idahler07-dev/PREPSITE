import { expect, test } from "@playwright/test";
import { signIn, uniqueEmail } from "./helpers";

test("plan, mistake notebook, vocabulary and notification settings", async ({ page }) => {
  await signIn(page, uniqueEmail("learner"));
  await page.getByRole("button", { name: "Skip for now" }).click();

  // Dashboard: today's plan and the question of the day.
  await page.goto("/dashboard");
  await expect(page.getByText("Today's plan", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Question of the day" }).click();
  await expect(page).toHaveURL(/\/test\//);
  // The daily question changes by date: multiple choice or a typed answer.
  const typed = page.getByLabel("Your answer");
  await expect(page.getByRole("radio").first().or(typed)).toBeVisible();
  if (await typed.isVisible()) await typed.fill("0");
  else await page.getByRole("radio").first().check({ force: true });
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByRole("status").filter({ hasText: /Correct|Incorrect/ })).toBeVisible();

  await page.goto("/plan");
  await expect(page.getByRole("heading", { name: "Study plan" })).toBeVisible();
  await expect(page.getByText("Vocabulary cards").first()).toBeVisible();

  await page.goto("/review");
  await expect(page.getByRole("heading", { name: "Mistake notebook" })).toBeVisible();

  await page.goto("/vocab");
  await page.getByRole("button", { name: "Show meaning" }).click();
  await page.getByRole("button", { name: "Good" }).click();
  await expect(page.getByText(/Card 2 of/)).toBeVisible();

  await page.goto("/settings");
  const box = page.getByRole("checkbox", { name: "Study reminders — Email" });
  await expect(box).not.toBeChecked();
  await box.check();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Study reminders — Email" })).toBeChecked();
});
