import { execSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
import { E2E_DATABASE_URL } from "../../playwright.config";
import { signIn, uniqueEmail } from "./helpers";

/** 10 published questions per domain × difficulty, enough for one full adaptive test. Answer is always B. */
function seedMockBank() {
  const sql = `
    INSERT INTO "Question" (id, code, section, domain, skill, difficulty, type, passage, stem, choices, "correctAnswers", tags, flags, origin, status, "updatedAt")
    SELECT 'e2e-mk-' || s.section || '-' || d.domain || '-' || f.diff || '-' || n,
           'MK-' || s.section || '-' || substr(d.domain, 1, 3) || '-' || f.diff || '-' || lpad(n::text, 2, '0'),
           s.section::"Section", d.domain, d.skill, f.diff::"Difficulty", 'MCQ'::"QuestionType",
           CASE WHEN s.section = 'RW' THEN 'Mock passage about river otters number ' || n || '. Otters are playful animals.' END,
           'Mock question ' || n || ' (' || d.domain || ')',
           '[{"key":"A","text":"one"},{"key":"B","text":"two"},{"key":"C","text":"three"},{"key":"D","text":"four"}]'::jsonb,
           ARRAY['B'], '{}', '{}', 'MANUAL'::"QuestionOrigin", 'PUBLISHED'::"QuestionStatus", now()
    FROM (VALUES ('RW'), ('MATH')) s(section)
    JOIN (VALUES ('RW','CRAFT_AND_STRUCTURE','WORDS_IN_CONTEXT'),('RW','INFORMATION_AND_IDEAS','CENTRAL_IDEAS_AND_DETAILS'),
                 ('RW','STANDARD_ENGLISH_CONVENTIONS','BOUNDARIES'),('RW','EXPRESSION_OF_IDEAS','RHETORICAL_SYNTHESIS'),
                 ('MATH','ALGEBRA','LINEAR_EQUATIONS_ONE_VARIABLE'),('MATH','ADVANCED_MATH','NONLINEAR_FUNCTIONS'),
                 ('MATH','PROBLEM_SOLVING_AND_DATA_ANALYSIS','RATIOS_RATES_PROPORTIONS_UNITS'),('MATH','GEOMETRY_AND_TRIGONOMETRY','AREA_AND_VOLUME')) d(section, domain, skill)
      ON d.section = s.section
    CROSS JOIN (VALUES ('EASY'),('MEDIUM'),('HARD')) f(diff)
    CROSS JOIN generate_series(1, 10) n
    ON CONFLICT (code) DO UPDATE SET skill = EXCLUDED.skill;`;
  execSync(`psql "${E2E_DATABASE_URL}" -q`, { input: sql, stdio: ["pipe", "pipe", "pipe"] });
}

async function submitModule(page: Page) {
  await page.getByRole("button", { name: /^Question \d+ of \d+/ }).click();
  await page.getByRole("button", { name: "Go to review page" }).click();
  await page.getByRole("button", { name: "Submit answers" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Submit" }).click();
}

test("admin builds a practice test; a student takes it with the test tools and gets an estimated score", async ({ page, browser }) => {
  test.setTimeout(180_000);
  seedMockBank();
  await signIn(page, "owner@e2e.test");
  if (page.url().includes("onboarding")) await page.getByRole("button", { name: "Skip for now" }).click();
  await page.goto("/manage/mocks");
  await page.getByLabel("Title").fill("E2E Practice Test");
  await page.getByRole("button", { name: "Build test" }).click();
  await expect(page.getByRole("heading", { name: "E2E Practice Test" })).toBeVisible();
  await expect(page.getByText("Harder module 2").first()).toBeVisible();
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText(/Published/).first()).toBeVisible();

  const student = await browser.newPage();
  await signIn(student, uniqueEmail("mock"));
  await student.getByRole("button", { name: "Skip for now" }).click();
  await student.goto("/mocks");
  const card = student.getByRole("listitem").filter({ hasText: "E2E Practice Test" });
  await card.getByRole("button", { name: "Start full test" }).click();
  await expect(student).toHaveURL(/\/test\//);
  await expect(student.getByRole("heading", { name: "Reading and Writing: Module 1" })).toBeVisible();

  // Highlight part of the passage and add a note; both survive a reload.
  await student.getByRole("button", { name: "Highlight" }).click();
  const passage = student.locator(".passage");
  const firstWords = await passage.evaluate((el) => {
    const text = el.querySelector("p")!.firstChild!;
    const r = document.createRange();
    r.setStart(text, 0);
    r.setEnd(text, 12);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(r);
    return r.toString();
  });
  await passage.dispatchEvent("pointerup");
  await expect(passage.locator("mark.hl-yellow")).toHaveText(firstWords);
  await student.getByRole("button", { name: "Add note" }).click();
  await student.getByLabel("Your note on this question").fill("otters!");
  await student.keyboard.press("Escape");
  await student.waitForTimeout(1200); // debounced save
  await student.reload();
  await expect(student.locator(".passage mark.hl-yellow")).toHaveText(firstWords);
  await expect(student.getByRole("button", { name: "Edit note" })).toBeVisible();

  // Answer question 1, then submit both Reading and Writing modules.
  await student.getByRole("radio", { name: "Choice B" }).check({ force: true });
  await submitModule(student);
  await expect(student.getByRole("heading", { name: "Reading and Writing: Module 2" })).toBeVisible();
  await submitModule(student);

  // Break, then Math with the calculator and reference sheet.
  await expect(student.getByRole("heading", { name: "Break" })).toBeVisible();
  await student.getByRole("button", { name: "Resume testing" }).click();
  await expect(student.getByRole("heading", { name: "Math: Module 1" })).toBeVisible();
  await student.getByRole("button", { name: "Calculator" }).click();
  await student.getByLabel("Expression").fill("2(3 + 4)^2");
  await student.getByLabel("Expression").press("Enter");
  await expect(student.locator("#calc-result")).toHaveText("= 98");
  await student.getByRole("button", { name: "Close calculator" }).click();
  await student.getByRole("button", { name: "Reference sheet" }).click();
  await expect(student.getByText("Pythagorean theorem")).toBeVisible();
  await student.keyboard.press("Escape");
  await submitModule(student);
  await expect(student.getByRole("heading", { name: "Math: Module 2" })).toBeVisible();
  await submitModule(student);

  await expect(student).toHaveURL(/\/attempts\//);
  await expect(student.getByText("Estimated score, not an official College Board score.", { exact: false })).toBeVisible();
  await expect(student.getByText("Total (400–1600)")).toBeVisible();
  await expect(student.getByText("Module 2 was the easier one", { exact: false }).first()).toBeVisible();
  await student.close();
});
