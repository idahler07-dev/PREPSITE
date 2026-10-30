import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { signIn, uniqueEmail } from "./helpers";

async function makePdf(lines: string[]) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([612, 792]);
  lines.forEach((line, i) => line && page.drawText(line, { x: 60, y: 740 - i * 16, size: 11, font }));
  return Buffer.from(await doc.save());
}

// Typed PDF, no AI key: read from the text layer by the background worker.
test("admin uploads a PDF booklet and key, reviews, publishes, and the question appears in a drill", async ({ page, browser }) => {
  await signIn(page, "admin@e2e.test");
  if (page.url().includes("onboarding")) await page.getByRole("button", { name: "Skip for now" }).click();

  const dir = test.info().outputDir;
  mkdirSync(dir, { recursive: true });
  const booklet = path.join(dir, "booklet.pdf");
  const key = path.join(dir, "key.pdf");
  writeFileSync(booklet, await makePdf(["1. PDF-E2E-STEM: If 4x = 20, what is the value of x?", "A) 4", "B) 5", "C) 6", "D) 16"]));
  writeFileSync(key, await makePdf(["Answer Key", "1. B"]));

  await page.goto("/admin/import");
  const panel = page.getByRole("tabpanel");
  const newSource = panel.getByText("Create a new source");
  if (await newSource.isVisible()) await newSource.click();
  await panel.getByLabel("Source name").fill("E2E booklet");
  await panel.getByLabel("Owner").fill("Our centre");
  await panel.getByText("These questions were written by us").click();
  await panel.getByLabel("Question code prefix").fill("E2E-P-");
  await page.locator("#pdf-files").setInputFiles(booklet);
  await page.locator("#pdf-key").setInputFiles(key);
  await panel.getByRole("button", { name: "Upload and read" }).click();

  await expect(page.getByText("Import finished")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("1 question created as drafts")).toBeVisible();
  await expect(page.getByText("1 answer taken from the answer key")).toBeVisible();

  await page.getByRole("link", { name: "Open review queue" }).click();
  await expect(page.getByRole("cell", { name: /^E2E-P-ALG-0001/ })).toBeVisible();
  await page.getByLabel("Select all on this page").check();
  await page.getByRole("button", { name: "Confirm domain and skill" }).click();
  await expect(page.getByText("1 updated, 0 skipped")).toBeVisible();
  await page.getByRole("button", { name: "Publish all clean questions" }).click();
  await expect(page.getByRole("cell", { name: /^E2E-P-ALG-0001/ })).toHaveCount(0);

  const student = await browser.newPage();
  await signIn(student, uniqueEmail("pdfdrill"));
  await student.getByRole("button", { name: "Skip for now" }).click();
  await student.goto("/practice");
  await student.getByText("Question code range").click();
  await student.getByLabel("From code").fill("E2E-P-ALG-0001");
  await student.getByLabel("To code").fill("E2E-P-ALG-0001");
  await expect(student.getByText("1 question matches")).toBeVisible();
  await student.getByRole("button", { name: "Start drill" }).click();
  await expect(student.getByText(/PDF-E2E-STEM/)).toBeVisible();
  await student.close();
});
