import { describe, expect, it } from "vitest";
import { isSprCorrect, parseSpr, validateSprInput } from "@/lib/questions/spr";
import { gradeAnswer } from "@/lib/questions/grading";

describe("SPR input validation", () => {
  it("accepts integers, decimals and fractions within the length limit", () => {
    for (const v of ["7", "-7", "0.5", ".5", "1/2", "-1/2", "12345", "-1234", "-.125"]) {
      expect(validateSprInput(v), v).toBeNull();
    }
  });

  it("rejects bad input", () => {
    expect(validateSprInput("")).toBe("EMPTY");
    expect(validateSprInput("123456")).toBe("TOO_LONG");
    expect(validateSprInput("-123456")).toBe("TOO_LONG");
    expect(validateSprInput("3 1/2")).toBe("MIXED_NUMBER");
    expect(validateSprInput("50%")).toBe("INVALID");
    expect(validateSprInput("1,000")).toBe("INVALID");
    expect(validateSprInput("1/0")).toBe("DIVIDE_BY_ZERO");
    expect(validateSprInput(".")).toBe("INVALID");
    expect(validateSprInput("1.2.3")).toBe("INVALID");
  });

  it("treats the unicode minus sign as a minus", () => {
    const p = parseSpr("−3");
    expect("error" in p).toBe(false);
  });
});

describe("SPR equivalence", () => {
  it("accepts equivalent forms of 1/2", () => {
    for (const v of ["1/2", "2/4", ".5", "0.5", "0.50", "3/6"]) expect(isSprCorrect(v, ["1/2"]), v).toBe(true);
    expect(isSprCorrect("0.4", ["1/2"])).toBe(false);
  });

  it("accepts truncated or rounded repeating decimals only when they fill the box", () => {
    const key = ["2/3"];
    for (const v of ["2/3", "4/6", ".6666", ".6667", "0.666", "0.667"]) expect(isSprCorrect(v, key), v).toBe(true);
    for (const v of [".66", ".67", "0.67", ".6", ".6668", ".6665"]) expect(isSprCorrect(v, key), v).toBe(false);
  });

  it("handles negatives", () => {
    const key = ["-2/3"];
    for (const v of ["-2/3", "-.6666", "-.6667", "-0.666", "-0.667"]) expect(isSprCorrect(v, key), v).toBe(true);
    expect(isSprCorrect(".6667", key)).toBe(false);
    expect(isSprCorrect("2/-3", key)).toBe(true);
  });

  it("rounds a long author decimal the same way", () => {
    expect(isSprCorrect("3.142", ["3.14159"])).toBe(true);
    expect(isSprCorrect("3.141", ["3.14159"])).toBe(true);
    expect(isSprCorrect("3.14", ["3.14159"])).toBe(false);
  });

  it("matches any of several accepted answers", () => {
    expect(isSprCorrect("-4", ["3", "-4"])).toBe(true);
    expect(isSprCorrect("0", ["0"])).toBe(true);
    expect(isSprCorrect("-0", ["0"])).toBe(true);
  });
});

describe("gradeAnswer", () => {
  it("grades multiple choice case-insensitively", () => {
    expect(gradeAnswer({ type: "MCQ", correctAnswers: ["B"] }, "b")).toBe(true);
    expect(gradeAnswer({ type: "MCQ", correctAnswers: ["B"] }, "C")).toBe(false);
    expect(gradeAnswer({ type: "MCQ", correctAnswers: ["B"] }, null)).toBe(false);
  });
  it("grades SPR with equivalence", () => {
    expect(gradeAnswer({ type: "SPR", correctAnswers: ["1/4"] }, ".25")).toBe(true);
    expect(gradeAnswer({ type: "SPR", correctAnswers: ["1/4"] }, "")).toBe(false);
  });
});
