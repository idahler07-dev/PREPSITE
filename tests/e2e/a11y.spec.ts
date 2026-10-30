import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { signIn, uniqueEmail } from "./helpers";

/** Automated accessibility checks (axe, WCAG 2.1 AA) on the main pages. Serious and critical issues fail the test. */
async function check(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad.map((v) => `${v.id}: ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`), url).toEqual([]);
}

test("public pages", async ({ page }) => {
  for (const url of ["/", "/pricing", "/login", "/resources", "/faq"]) await check(page, url);
});

test("student pages", async ({ page }) => {
  await signIn(page, uniqueEmail("a11y"));
  await page.getByRole("button", { name: "Skip for now" }).click();
  for (const url of ["/dashboard", "/practice", "/mocks", "/plan", "/review", "/vocab", "/billing", "/settings"]) await check(page, url);
  await page.goto("/practice");
  await page.getByRole("button", { name: "10 math questions" }).click();
  await page.waitForURL(/\/test\//);
  await check(page, page.url().replace(/^https?:\/\/[^/]+/, ""));
});

test("admin pages", async ({ page }) => {
  await signIn(page, "admin@e2e.test");
  if (page.url().includes("onboarding")) await page.getByRole("button", { name: "Skip for now" }).click();
  for (const url of ["/admin", "/admin/questions", "/admin/review", "/admin/import", "/admin/mocks", "/admin/orders", "/admin/analytics", "/admin/vocab"]) await check(page, url);
});
