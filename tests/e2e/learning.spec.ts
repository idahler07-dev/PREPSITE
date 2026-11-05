import { expect, test } from "@playwright/test";
import { signIn, uniqueEmail } from "./helpers";

test("plan, mistake notebook, vocabulary and notification settings", async ({ page }) => {
  await signIn(page, uniqueEmail("learner"));
  await page.getByRole("button", { name: "Skip for now" }).click();

  // Path: daily quests and the question of the day.
  await page.goto("/sat?start=1");
  // While a route streams in, React keeps a hidden copy of the page for a moment.
  await expect(page.getByText("Daily quests", { exact: true }).filter({ visible: true })).toBeVisible();
  await page.getByRole("button", { name: "Question of the day" }).click();
  await expect(page).toHaveURL(/\/test\//);
  // The daily question changes by date: multiple choice or a typed answer.
  const typed = page.getByLabel("Your answer");
  await expect(page.getByRole("radio").first().or(typed).first()).toBeVisible();
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
  const box = page.getByRole("switch", { name: "Study reminders — Email" });
  await expect(box).not.toBeChecked();
  await box.check();
  await page.reload();
  await expect(page.getByRole("switch", { name: "Study reminders — Email" })).toBeChecked();
});

test("a student who already took a practice test enters the score with the rulers", async ({ page }) => {
  await signIn(page, uniqueEmail("score"));
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.goto("/sat");
  await page.getByRole("button", { name: "I have a score" }).click();

  const math = page.getByRole("slider", { name: "Math" });
  const rw = page.getByRole("slider", { name: "Reading and Writing" });
  await expect(math).toHaveAttribute("aria-valuenow", "600");
  await math.focus();
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
  await rw.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(math).toHaveAttribute("aria-valuenow", "630");
  await expect(rw).toHaveAttribute("aria-valuenow", "590");

  await page.getByRole("button", { name: "Save score" }).click();
  await expect(page.getByText("Practice test,").filter({ visible: true })).toBeVisible();
  await expect(page.getByText("Reading and Writing 590 · Math 630").filter({ visible: true })).toBeVisible();
});
