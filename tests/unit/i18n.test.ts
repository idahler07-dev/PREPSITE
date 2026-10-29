import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { compareMessages, flattenKeys, placeholders } from "@/lib/i18n-check";
import { ENABLED_LOCALES } from "@/i18n/locales";

const read = (code: string) => JSON.parse(readFileSync(path.join(process.cwd(), "messages", `${code}.json`), "utf8"));

describe("translation helpers", () => {
  it("flattens nested keys", () => {
    expect(flattenKeys({ a: { b: "x", c: { d: "y" } }, e: "z" })).toEqual(["a.b", "a.c.d", "e"]);
  });
  it("finds ICU placeholders", () => {
    expect(placeholders("{count, plural, one {# day} other {# days}} for {name}")).toEqual(["count", "name"]);
  });
  it("reports missing keys and placeholder mismatches", () => {
    const r = compareMessages("xx", { a: "Hi {name}", b: "x" }, { a: "Salom" });
    expect(r.missing).toEqual(["b"]);
    expect(r.placeholderMismatch).toEqual(["a"]);
  });
});

describe("enabled locales are complete", () => {
  const en = read("en");
  for (const code of ENABLED_LOCALES.filter((c) => c !== "en")) {
    it(`${code} has every key with matching placeholders`, () => {
      const r = compareMessages(code, en, read(code));
      expect(r.missing).toEqual([]);
      expect(r.placeholderMismatch).toEqual([]);
    });
  }
});
