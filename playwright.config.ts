import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://localhost:${PORT}`;
export const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL ?? "postgresql://prep:prep@localhost:5432/prepsite_e2e";

/** Environment for the app under test: its own database, dev mail outbox, known admin. */
export const e2eEnv = {
  DATABASE_URL: E2E_DATABASE_URL,
  NEXT_PUBLIC_SITE_URL: BASE_URL,
  AUTH_URL: BASE_URL,
  AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-e2e",
  ADMIN_EMAILS: "admin@e2e.test",
  EMAIL_TRANSPORT: "outbox",
  ALLOW_DEV_OUTBOX: "true",
  STORAGE_DRIVER: "local",
  STORAGE_LOCAL_DIR: ".data/e2e-storage",
  PAYMENT_PROVIDERS: "mock",
  MAGIC_LINKS_PER_IP_HOUR: "100",
  ALLOW_MOCK_PAYMENTS: "true",
  PORT: String(PORT),
};

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...(process.env.PW_CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } } : {}),
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Build once (`pnpm build`) before running; `E2E_SKIP_BUILD=1` reuses an existing build.
    command: process.env.E2E_SKIP_BUILD ? "pnpm start" : "pnpm build && pnpm start",
    // A static file: the database is prepared by globalSetup, which runs after the server starts.
    url: `${BASE_URL}/brand/mark.svg`,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
    env: e2eEnv,
  },
});
