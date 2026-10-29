import { describe, expect, it } from "vitest";
import { evaluateCheck, mathCheck, numericValueOf } from "@/lib/ai/math-check";

describe("math check for AI drafts", () => {
  it("evaluates arithmetic and rejects anything else", () => {
    expect(evaluateCheck("(11 - 3) / 2")).toBe(4);
    expect(evaluateCheck("sqrt(2)^2")).toBeCloseTo(2);
    expect(evaluateCheck("2 * pi * 3")).toBeCloseTo(6 * Math.PI);
    for (const bad of ["import({}, {})", "range(1, 1e9)", "x + 1", "createUnit('a')", "evaluate('1')", "a = 3", "[1,2]", "f(x) = x"]) {
      expect(evaluateCheck(bad)).toBeNull();
    }
  });

  it("reads numbers from choices and typed answers", () => {
    expect(numericValueOf("$\\frac{3}{4}$")).toBe(0.75);
    expect(numericValueOf("$4\\sqrt{2}$")).toBeCloseTo(4 * Math.SQRT2);
    expect(numericValueOf("-2.5")).toBe(-2.5);
    expect(numericValueOf("1,200")).toBe(1200);
    expect(numericValueOf("12%")).toBe(0.12);
    expect(numericValueOf("$x = 4$")).toBeNull();
    expect(numericValueOf("The ratio increases")).toBeNull();
  });

  it("passes, fails or skips the check", () => {
    const choices = ["3", "4", "7", "8"].map((text, i) => ({ key: "ABCD"[i]!, text }));
    expect(mathCheck({ type: "MCQ", choices, correctAnswers: ["B"], checkExpression: "(11-3)/2" })).toBe("pass");
    expect(mathCheck({ type: "MCQ", choices, correctAnswers: ["C"], checkExpression: "(11-3)/2" })).toBe("fail");
    expect(mathCheck({ type: "SPR", correctAnswers: ["3/4", ".75"], checkExpression: "3/4" })).toBe("pass");
    expect(mathCheck({ type: "SPR", correctAnswers: ["2"], checkExpression: null })).toBe("unchecked");
    expect(mathCheck({ type: "MCQ", choices: [{ key: "A", text: "$y = 2x$" }], correctAnswers: ["A"], checkExpression: "2" })).toBe("unchecked");
  });
});
