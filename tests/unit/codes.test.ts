import { describe, expect, it } from "vitest";
import { codeTemplate, formatCode, isValidCode, maxUsedNumber, normalizeCode, suggestCodes } from "@/lib/questions/codes";

const FORMAT = "{prefix}{domain}-{number}";

describe("question codes", () => {
  const t = codeTemplate(FORMAT, "lc-m-", "alg");

  it("builds the template from prefix and domain", () => {
    expect(t).toEqual({ head: "LC-M-ALG-", tail: "" });
    expect(formatCode(t, 7, 4)).toBe("LC-M-ALG-0007");
  });

  it("suggests the number after the highest existing one", () => {
    const existing = ["LC-M-ALG-0001", "LC-M-ALG-0009", "LC-M-ADV-0050", "LC-M-ALG-X", "OTHER-0100"];
    expect(maxUsedNumber(existing, t)).toBe(9);
    expect(suggestCodes(existing, t, 4, 3)).toEqual(["LC-M-ALG-0010", "LC-M-ALG-0011", "LC-M-ALG-0012"]);
  });

  it("starts at 1 for a new prefix and skips reserved codes", () => {
    expect(suggestCodes([], t, 4)).toEqual(["LC-M-ALG-0001"]);
    expect(suggestCodes([], t, 4, 2, new Set(["LC-M-ALG-0001"]))).toEqual(["LC-M-ALG-0002", "LC-M-ALG-0003"]);
  });

  it("supports formats with text after the number", () => {
    const t2 = codeTemplate("{prefix}{number}-{domain}", "X-", "geo");
    expect(t2).toEqual({ head: "X-", tail: "-GEO" });
    expect(suggestCodes(["X-0004-GEO", "X-0009-ALG"], t2, 4)).toEqual(["X-0005-GEO"]);
  });

  it("never returns a code that is already taken", () => {
    const codes = suggestCodes(["LC-M-ALG-0002"], t, 4, 5);
    expect(new Set(codes).size).toBe(5);
    expect(codes).not.toContain("LC-M-ALG-0002");
  });

  it("normalizes and validates codes", () => {
    expect(normalizeCode("  lc m alg 0001 ")).toBe("LC-M-ALG-0001");
    expect(isValidCode("LC-M-ALG-0001")).toBe(true);
    expect(isValidCode("lc")).toBe(false);
    expect(isValidCode("-BAD")).toBe(false);
    expect(isValidCode("A")).toBe(false);
  });
});
