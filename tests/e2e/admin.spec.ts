import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { signIn, uniqueEmail } from "./helpers";

const CSV = [
  "code,section,domain,skill,difficulty,type,passage,stem,choice_a,choice_b,choice_c,choice_d,correct_answer,explanation,image_url",
  ",MATH,Algebra,Linear functions,easy,MCQ,,E2E-UNIQUE-STEM-ONE: If $h(x) = 2x + 1$ then what is $h(3)$?,5,6,7,8,C,$2(3) + 1 = 7$.,",
  ",MATH,Algebra,Linear functions,medium,SPR,,E2E-UNIQUE-STEM-TWO: If $3x = 12$ what is $x$?,,,,,4,,",
  ",MATH,Algebra,Linear functions,easy,MCQ,,E2E row without an answer,1,2,3,4,,,",
].join("\n");

test("admin imports a spreadsheet, reviews, publishes, and the question appears in a drill", async ({ page, browser }) => {
  await signIn(page, "owner@e2e.test");
  if (page.url().includes("onboarding")) await page.getByRole("button", { name: "Skip for now" }).click();

  mkdirSync(test.info().outputDir, { recursive: true });
  const file = path.join(test.info().outputDir, "import.csv");
  writeFileSync(file, CSV);
  await page.goto("/manage/import");
  await page.getByRole("tab", { name: "CSV / Excel" }).click();
  await page.getByRole("tabpanel").getByText("Create a new source").click();
  await page.getByLabel("Source name").fill("E2E worksheets");
  await page.getByLabel("Owner").fill("Our centre");
  await page.getByText("These questions were written by us").click();
  await page.getByLabel("Question code prefix").fill("E2E-M-");
  await page.locator("#file").setInputFiles(file);
  await page.getByRole("button", { name: "Check file" }).click();

  await expect(page.getByText("3 rows: 2 ready, 1 with flags, 0 with errors")).toBeVisible();
  await page.getByRole("button", { name: "Import 3 questions as drafts" }).click();
  await expect(page).toHaveURL(/\/manage\/review\?batch=/);
  await expect(page.getByRole("cell", { name: /^E2E-M-ALG-000[123]/ })).toHaveCount(3);

  await page.getByRole("button", { name: "Publish all clean questions" }).click();
  await expect(page.getByText("2 updated, 0 skipped")).toBeVisible();
  // Only the question with a blocking flag is still waiting.
  await expect(page.getByRole("cell", { name: /^E2E-M-ALG-000/ })).toHaveCount(1);
  await expect(page.getByText("Missing answer")).toBeVisible();

  // A student drill limited to the imported codes contains the new questions.
  const student = await browser.newPage();
  await signIn(student, uniqueEmail("drill"));
  await student.getByRole("button", { name: "Skip for now" }).click();
  await student.goto("/practice");
  await student.getByText("Question code range").click();
  await student.getByLabel("From code").fill("E2E-M-ALG-0001");
  await student.getByLabel("To code").fill("E2E-M-ALG-9999");
  await expect(student.getByText("2 questions match")).toBeVisible();
  await student.getByRole("button", { name: "Start drill" }).click();
  await expect(student).toHaveURL(/\/test\//);
  await expect(student.getByText(/E2E-UNIQUE-STEM-(ONE|TWO)/)).toBeVisible();
  await student.close();
});

test("admin creates and publishes a question in the editor", async ({ page }) => {
  await signIn(page, "owner@e2e.test");
  await page.goto("/manage/questions/new");
  await page.getByRole("button", { name: "Suggest next code" }).click();
  await expect(page.getByLabel("Code", { exact: true })).toHaveValue(/^LC-M-ALG-\d{4}$/);
  await page.getByLabel("Question", { exact: true }).fill("If $5x = 35$, what is the value of $x$?");
  for (const [k, v] of [["A", "5"], ["B", "6"], ["C", "7"], ["D", "8"]] as const) await page.getByRole("textbox", { name: `Choice ${k}` }).fill(v);
  await page.getByLabel("Mark C as correct").check();
  await expect(page.locator(".katex").first()).toBeVisible(); // live preview
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page).toHaveURL(/\/manage\/questions\/c[a-z0-9]+$/);
  await expect(page.getByText("Published").first()).toBeVisible();
  await expect(page.getByText("Version 1")).toHaveCount(0); // history shows once there are edits
});
