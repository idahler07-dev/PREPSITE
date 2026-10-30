import { execSync } from "node:child_process";

/** Integration tests use their own database (TEST_DATABASE_URL); migrations are applied once. */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://prep:prep@localhost:5432/prepsite_test";
  process.env.TEST_DATABASE_URL = url;
  execSync("pnpm prisma migrate deploy", { env: { ...process.env, DATABASE_URL: url }, stdio: "pipe" });
}
