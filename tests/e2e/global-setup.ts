import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import { E2E_DATABASE_URL } from "../../playwright.config";

/** Fresh database with migrations and the sample questions; empty mail outbox. */
export default function globalSetup() {
  const env = { ...process.env, DATABASE_URL: E2E_DATABASE_URL };
  execSync("pnpm prisma migrate deploy", { env, stdio: "pipe" });
  execSync(
    `psql "${E2E_DATABASE_URL}" -qc "DO \\$\\$ DECLARE r record; BEGIN FOR r IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations' LOOP EXECUTE 'TRUNCATE TABLE \\"' || r.tablename || '\\" CASCADE'; END LOOP; END \\$\\$;"`,
    { env, stdio: "pipe" },
  );
  execSync("pnpm tsx prisma/seed.ts", { env, stdio: "pipe" });
  rmSync(path.join(process.cwd(), ".data", "dev-mail"), { recursive: true, force: true });
}
