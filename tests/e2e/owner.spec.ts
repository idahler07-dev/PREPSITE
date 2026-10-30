import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { signIn, uniqueEmail } from "./helpers";

/**
 * Only owners (OWNER_EMAILS, verified) can manage content. Everyone else gets a
 * plain 404 from every manage page and API: signed out or signed in, with or
 * without the links. Pages and routes are read from the file system, so a new
 * one is covered automatically.
 */
function files(dir: string, name: RegExp): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? files(p, name) : name.test(f) ? [p] : [];
  });
}

const toUrl = (file: string, root: string, base: string) =>
  base +
  path
    .relative(root, path.dirname(file))
    .split(path.sep)
    .filter(Boolean)
    .map((seg) => (seg.startsWith("[") ? "e2e-missing-id" : seg))
    .map((seg) => `/${seg}`)
    .join("");

const PAGES = files("src/app/manage", /^page\.tsx$/).map((f) =>
  toUrl(f, "src/app/manage", "/manage"),
);
const APIS = files("src/app/api/manage", /^route\.ts$/).flatMap((f) => {
  const url = toUrl(f, "src/app/api/manage", "/api/manage");
  return [
    ...readFileSync(f, "utf8").matchAll(
      /export async function (GET|POST|PUT|PATCH|DELETE)\b/g,
    ),
  ].map((m) => ({ method: m[1]!, url }));
});

async function expectNoManageAccess(page: Page, request: APIRequestContext) {
  for (const url of PAGES) {
    const res = await page.goto(url);
    expect(res?.status(), url).toBe(404);
    await expect(
      page.getByRole("heading", { name: "Pip can't find that page" }),
      url,
    ).toBeVisible();
  }
  const origin = new URL(page.url()).origin;
  for (const { method, url } of APIS) {
    // Same-origin, so the CSRF check passes and the owner check is what answers.
    const res = await request.fetch(url, {
      method,
      headers: { origin },
      data: method === "GET" ? undefined : {},
    });
    expect(res.status(), `${method} ${url}`).toBe(404);
  }
}

test("covers every manage page and API", () => {
  expect(PAGES.length).toBeGreaterThan(15);
  expect(APIS.length).toBeGreaterThan(6);
});

test("signed-out visitors get 404 from every manage page and API", async ({
  page,
}) => {
  await page.goto("/");
  await expectNoManageAccess(page, page.request);
});

test("a normal user gets 404 from every manage page and API, and sees no Manage link", async ({
  page,
}) => {
  await signIn(page, uniqueEmail("member"));
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.getByRole("button", { name: "Account" }).click();
  await expect(page.getByRole("menuitem", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Manage" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expectNoManageAccess(page, page.request);
});

test("the owner sees Manage and can open it", async ({ page }) => {
  await signIn(page, "owner2@e2e.test");
  if (page.url().includes("onboarding"))
    await page.getByRole("button", { name: "Skip for now" }).click();
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Account" }).click();
  await page.getByRole("menuitem", { name: "Manage" }).click();
  await expect(page).toHaveURL(/\/manage$/);
  const res = await page.request.get(
    "/api/manage/imports/template?section=MATH",
  );
  expect(res.status()).toBe(200);
});
