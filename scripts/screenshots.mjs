/**
 * Screenshots of key pages in desktop/mobile × light/dark, for design reviews.
 *
 *   BASE=http://localhost:3200 PREFIX=/en OUT=docs/redesign/before node scripts/screenshots.mjs
 *
 * Needs a server with DEMO_MODE=true (signs in with the demo student button).
 * PREFIX is the locale prefix of the build being captured ("" when there is none).
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const BASE = process.env.BASE ?? "http://localhost:3200";
const PREFIX = process.env.PREFIX ?? "";
const OUT = process.env.OUT ?? "docs/redesign/after";
mkdirSync(OUT, { recursive: true });

const VARIANTS = [
  { name: "desktop-light", viewport: { width: 1440, height: 900 }, colorScheme: "light" },
  { name: "desktop-dark", viewport: { width: 1440, height: 900 }, colorScheme: "dark" },
  { name: "mobile-light", viewport: { width: 390, height: 844 }, colorScheme: "light", isMobile: true, hasTouch: true },
  { name: "mobile-dark", viewport: { width: 390, height: 844 }, colorScheme: "dark", isMobile: true, hasTouch: true },
];

const url = (p) => `${BASE}${PREFIX}${p}`;

async function dismissCookies(page) {
  const ok = page.getByRole("button", { name: /^(OK|Got it)$/ });
  if (await ok.isVisible().catch(() => false)) await ok.click();
}

/** Answer the current drill question and move on (works for choices and typed answers). */
async function answerAndNext(page) {
  const radios = page.getByRole("radio");
  if (await radios.count()) await radios.first().check({ force: true });
  else await page.getByLabel("Your answer").fill("1");
  await page.getByRole("button", { name: "Check answer" }).click();
  await page.getByRole("status").filter({ hasText: /Correct|Incorrect/ }).waitFor();
  await page.getByRole("button", { name: "Next", exact: true }).click();
}

async function startDrill(page) {
  await page.goto(url("/practice"));
  await page.getByRole("button", { name: /10 (math|reading)/i }).first().click();
  await page.waitForURL(/\/test\//);
  return page.url();
}

const browser = await chromium.launch();

// One demo student for all variants; one drill left open, one finished.
const setup = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const sp = await setup.newPage();
await sp.goto(url("/login"));
await dismissCookies(sp);
await sp.getByRole("button", { name: "Try as a student" }).click();
await sp.waitForURL(/dashboard|onboarding/);
if (/onboarding/.test(sp.url())) {
  const skip = sp.getByRole("button", { name: /Skip/ });
  if (await skip.isVisible().catch(() => false)) await skip.click();
}
const finishedDrill = await startDrill(sp);
for (let i = 0; i < 10; i++) await answerAndNext(sp);
await sp.getByRole("button", { name: /Finish/ }).click();
await sp.getByRole("button", { name: "Submit", exact: true }).click();
await sp.waitForURL(/\/attempts\//);
const resultsUrl = sp.url();
const openDrill = await startDrill(sp);
await answerAndNext(sp);
const state = await setup.storageState();
await setup.close();
console.log("drills:", finishedDrill, openDrill, "results:", resultsUrl);

const PAGES = [
  { name: "01-home", url: url("/"), auth: false },
  { name: "02-pricing", url: url("/pricing"), auth: false },
  { name: "03-login", url: url("/login"), auth: false },
  { name: "04-dashboard", url: url("/dashboard"), auth: true },
  { name: "05-practice", url: url("/practice"), auth: true },
  { name: "06-test", url: openDrill, auth: true },
  { name: "07-results", url: resultsUrl, auth: true },
  { name: "08-not-found", url: url("/this-page-does-not-exist"), auth: false },
];

for (const v of VARIANTS) {
  for (const auth of [false, true]) {
    const ctx = await browser.newContext({
      viewport: v.viewport,
      colorScheme: v.colorScheme,
      isMobile: v.isMobile,
      hasTouch: v.hasTouch,
      reducedMotion: "reduce",
      ...(auth ? { storageState: state } : {}),
    });
    const page = await ctx.newPage();
    for (const p of PAGES.filter((x) => x.auth === auth)) {
      await page.goto(p.url, { waitUntil: "networkidle" });
      await dismissCookies(page);
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT, `${p.name}-${v.name}.png`) });
    }
    await ctx.close();
  }
}
await browser.close();
console.log("saved to", OUT);
