/**
 * Report missing translation keys.
 *   pnpm i18n:check            all locales (missing keys in disabled locales are informational)
 *   pnpm i18n:check --strict   also fail on locales that are not enabled yet
 * Exits with code 1 when an enabled locale is missing keys or has broken placeholders.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { compareMessages } from "../src/lib/i18n-check";
import { ENABLED_LOCALES, LOCALES } from "../src/i18n/locales";

const dir = path.join(process.cwd(), "messages");
const strict = process.argv.includes("--strict");
const read = (code: string) => JSON.parse(readFileSync(path.join(dir, `${code}.json`), "utf8")) as unknown;
const base = read("en");
let failed = false;

for (const { code } of LOCALES) {
  if (code === "en") continue;
  const enabled = (ENABLED_LOCALES as readonly string[]).includes(code);
  const file = path.join(dir, `${code}.json`);
  if (!existsSync(file)) {
    console.log(`${code.padEnd(8)} ${enabled ? "ENABLED " : "disabled"}  no messages file yet`);
    if (enabled || strict) failed = true;
    continue;
  }
  const r = compareMessages(code, base, read(code));
  const status = r.missing.length || r.placeholderMismatch.length ? "✗" : "✓";
  console.log(
    `${code.padEnd(8)} ${enabled ? "ENABLED " : "disabled"}  ${status} missing ${r.missing.length}, extra ${r.extra.length}, placeholder mismatches ${r.placeholderMismatch.length}`,
  );
  const show = (label: string, keys: string[]) => {
    if (!keys.length) return;
    console.log(`    ${label}:`);
    for (const k of keys.slice(0, 50)) console.log(`      - ${k}`);
    if (keys.length > 50) console.log(`      … and ${keys.length - 50} more`);
  };
  if (enabled || strict) {
    show("missing", r.missing);
    show("placeholder mismatch", r.placeholderMismatch);
    show("extra (unused)", r.extra);
    if (r.missing.length || r.placeholderMismatch.length) failed = true;
  }
}

process.exit(failed ? 1 : 0);
