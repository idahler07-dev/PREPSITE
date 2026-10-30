/**
 * Check the UI messages.
 *   pnpm i18n:check   every message in messages/en.json must be valid ICU; any
 *                     other messages/{code}.json must have every English key
 *                     with matching placeholders.
 * The site is English only; this keeps it ready for adding languages later.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { IntlMessageFormat } from "intl-messageformat";
import { compareMessages, flattenKeys } from "../src/lib/i18n-check";

const dir = path.join(process.cwd(), "messages");
const read = (file: string) => JSON.parse(readFileSync(path.join(dir, file), "utf8")) as Record<string, unknown>;
const base = read("en.json");
let failed = false;

const bad: string[] = [];
for (const key of flattenKeys(base)) {
  const value = key.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], base);
  try {
    new IntlMessageFormat(String(value), "en");
  } catch (e) {
    bad.push(`${key}: ${(e as Error).message}`);
  }
}
console.log(`en       ${bad.length ? "✗" : "✓"} ${flattenKeys(base).length} messages, ${bad.length} invalid`);
for (const b of bad) console.log(`    - ${b}`);
if (bad.length) failed = true;

for (const file of readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "en.json")) {
  const code = file.replace(/\.json$/, "");
  const r = compareMessages(code, base, read(file));
  const ok = !r.missing.length && !r.placeholderMismatch.length;
  console.log(`${code.padEnd(8)} ${ok ? "✓" : "✗"} missing ${r.missing.length}, extra ${r.extra.length}, placeholder mismatches ${r.placeholderMismatch.length}`);
  if (!ok) failed = true;
}

process.exit(failed ? 1 : 0);
