import { describe, expect, it } from "vitest";
import { blockingFlags, computeContentFlags, mergeFlags } from "@/lib/questions/flags";
import { findNearDuplicates, fingerprintText } from "@/lib/questions/fingerprint";

const choices = [
  { key: "A", text: "1" },
  { key: "B", text: "2" },
  { key: "C", text: "3" },
  { key: "D", text: "4" },
];

describe("content flags", () => {
  it("passes a clean multiple-choice question", () => {
    expect(computeContentFlags({ type: "MCQ", stem: "What is $1+1$?", choices, correctAnswers: ["B"] })).toEqual([]);
  });

  it("flags a missing answer", () => {
    expect(computeContentFlags({ type: "MCQ", stem: "Q", choices, correctAnswers: [] })).toContain("MISSING_ANSWER");
  });

  it("flags anything other than exactly four filled choices", () => {
    expect(computeContentFlags({ type: "MCQ", stem: "Q", choices: choices.slice(0, 3), correctAnswers: ["A"] })).toContain("CHOICE_COUNT");
    const blank = choices.map((c, i) => (i === 2 ? { ...c, text: " " } : c));
    expect(computeContentFlags({ type: "MCQ", stem: "Q", choices: blank, correctAnswers: ["A"] })).toContain("CHOICE_COUNT");
  });

  it("flags an answer that is not one of the choices", () => {
    expect(computeContentFlags({ type: "MCQ", stem: "Q", choices, correctAnswers: ["E"] })).toContain("ANSWER_NOT_IN_CHOICES");
  });

  it("flags uncertain text markers", () => {
    expect(computeContentFlags({ type: "SPR", stem: "If x = [[?5]], what is 2x?", correctAnswers: ["10"] })).toContain("UNCERTAIN_TEXT");
  });

  it("flags SPR answers that cannot be parsed", () => {
    expect(computeContentFlags({ type: "SPR", stem: "Q", correctAnswers: ["ten"] })).toContain("INVALID_SPR_ANSWER");
    expect(computeContentFlags({ type: "SPR", stem: "Q", correctAnswers: ["10", "20/2"] })).toEqual([]);
  });

  it("flags a mentioned figure that is missing", () => {
    expect(computeContentFlags({ type: "SPR", stem: "The graph shown models y.", correctAnswers: ["1"] })).toContain("MISSING_FIGURE");
    expect(computeContentFlags({ type: "SPR", stem: "The graph shown models y. ![g](asset:abc)", correctAnswers: ["1"] })).toEqual([]);
    expect(
      computeContentFlags({ type: "SPR", stem: "The table shows values.\n\n| x | y |\n|---|---|\n| 1 | 2 |", correctAnswers: ["1"] }),
    ).toEqual([]);
  });

  it("does not flag math that only names a graph", () => {
    expect(computeContentFlags({ type: "SPR", stem: "The graph of the linear function $f$ passes through $(2, 5)$. What is $f(0)$?", correctAnswers: ["1"] })).toEqual([]);
    expect(computeContentFlags({ type: "SPR", stem: "The scatterplot below shows data.", correctAnswers: ["1"] })).toContain("MISSING_FIGURE");
  });

  it("keeps process flags when content flags are recomputed", () => {
    expect(mergeFlags(["STUDENT_REPORT", "MISSING_ANSWER"], [])).toEqual(["STUDENT_REPORT"]);
    expect(blockingFlags(["NEAR_DUPLICATE", "MISSING_ANSWER"])).toEqual(["MISSING_ANSWER"]);
  });
});

describe("near-duplicate detection", () => {
  const a = fingerprintText(["A bakery sells muffins for $3 each and cookies for $2 each. How many muffins were sold?"]);
  const b = fingerprintText(["A bakery sells muffins for $3 each and cookies for $2 each. How many cookies were sold?"]);
  const c = fingerprintText(["The function f is defined by f(x) = 2x + 3. What is f(4)?"]);

  it("finds near-identical text and ignores unrelated text", () => {
    const hits = findNearDuplicates(a, [
      { id: "1", code: "B", fingerprint: b },
      { id: "2", code: "C", fingerprint: c },
    ]);
    expect(hits.map((h) => h.code)).toEqual(["B"]);
  });

  it("is case and punctuation insensitive", () => {
    expect(fingerprintText(["Hello,  WORLD!"])).toBe(fingerprintText(["hello world"]));
  });
});
