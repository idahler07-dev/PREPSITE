import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import { missingRequiredColumns, normalizeHeader, normalizeRow, parseCsv, parseDifficulty, parseMcqAnswer, parseSection, parseSprAnswers, parseType } from "@/lib/import/spreadsheet";

const names = { domains: en.taxonomy.domains as Record<string, string>, skills: en.taxonomy.skills as Record<string, string> };
const defaults = { section: null, difficulty: "MEDIUM" as const, codePrefix: "LC-" };

describe("spreadsheet parsing", () => {
  it("normalizes headers loosely", () => {
    expect(normalizeHeader("﻿Choice A")).toBe("choice_a");
    expect(normalizeHeader(" Correct-Answer ")).toBe("correct_answer");
  });

  it("parses CSV with quotes, commas and line breaks", () => {
    const { headers, rows } = parseCsv('stem,correct_answer\n"Line one\nline two, with comma",B\n');
    expect(headers).toEqual(["stem", "correct_answer"]);
    expect(rows[0]!.stem).toBe("Line one\nline two, with comma");
    expect(missingRequiredColumns(["stem"])).toEqual(["correct_answer"]);
  });

  it("understands common ways of writing values", () => {
    expect(parseSection("Reading and Writing")).toBe("RW");
    expect(parseSection("maths")).toBe("MATH");
    expect(parseDifficulty("H")).toBe("HARD");
    expect(parseDifficulty("2")).toBe("MEDIUM");
    expect(parseType("grid-in")).toBe("SPR");
    expect(parseType("Multiple choice")).toBe("MCQ");
    expect(parseMcqAnswer("(c)")).toEqual(["C"]);
    expect(parseSprAnswers("1/2; .5 | 0.5")).toEqual(["1/2", ".5", "0.5"]);
  });

  it("accepts domain and skill by key, short code or English name, and infers the domain", () => {
    const r = normalizeRow({ stem: "Q", skill: "Words in Context", correct_answer: "A", choice_a: "x", choice_b: "y", choice_c: "z", choice_d: "w" }, 2, defaults, names);
    expect(r.errors).toEqual([]);
    expect(r.row).toMatchObject({ section: "RW", domain: "CRAFT_AND_STRUCTURE", skill: "WORDS_IN_CONTEXT", type: "MCQ", difficulty: "MEDIUM" });
    expect(r.warnings).toEqual(expect.arrayContaining(["DIFFICULTY_DEFAULTED", "TYPE_INFERRED"]));
  });

  it("reports rows that cannot be imported", () => {
    expect(normalizeRow({ stem: "", correct_answer: "A" }, 3, defaults, names).errors).toEqual(expect.arrayContaining(["MISSING_STEM", "MISSING_TAXONOMY"]));
    expect(normalizeRow({ stem: "Q", section: "Math", domain: "Craft and Structure", skill: "Words in Context" }, 4, defaults, names).errors).toContain("INVALID_DOMAIN");
    expect(normalizeRow({ stem: "Q", domain: "Algebra", skill: "Circles" }, 5, defaults, names).errors).toContain("INVALID_SKILL");
    expect(normalizeRow({ stem: "Q", domain: "Algebra", skill: "Linear functions", difficulty: "impossible" }, 6, defaults, names).errors).toContain("INVALID_DIFFICULTY");
    expect(normalizeRow({ stem: "Q", domain: "Algebra", skill: "Linear functions", image_url: "http://x/y.png" }, 7, defaults, names).errors).toContain("INVALID_IMAGE_URL");
  });

  it("flags content problems instead of rejecting the row", () => {
    const r = normalizeRow({ stem: "Q", domain: "Algebra", skill: "Linear functions", type: "MCQ", choice_a: "1", choice_b: "2", correct_answer: "D" }, 8, defaults, names);
    expect(r.errors).toEqual([]);
    expect(r.flags).toEqual(expect.arrayContaining(["CHOICE_COUNT", "ANSWER_NOT_IN_CHOICES"]));
  });
});
