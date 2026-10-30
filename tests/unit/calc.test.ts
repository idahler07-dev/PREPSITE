import { describe, expect, it } from "vitest";
import { evaluate, formatResult } from "@/lib/calc";

const ev = (s: string, angle: "deg" | "rad" = "deg") => formatResult(evaluate(s, { angle, ans: 5 }));

describe("calculator", () => {
  it("follows the order of operations", () => {
    expect(ev("2 + 3 × 4")).toBe("14");
    expect(ev("(2 + 3) * 4")).toBe("20");
    expect(ev("2^3^2")).toBe("512");
    expect(ev("-2^2")).toBe("-4");
    expect(ev("10 ÷ 4")).toBe("2.5");
    expect(ev("0.1 + 0.2")).toBe("0.3");
    expect(ev("50%")).toBe("0.5");
  });

  it("handles constants, functions, implicit multiplication and ans", () => {
    expect(ev("2π")).toBe(formatResult(2 * Math.PI));
    expect(ev("sqrt(16) + √9")).toBe("7");
    expect(ev("3(4)")).toBe("12");
    expect(ev("sin(30)")).toBe("0.5");
    expect(ev("cos(pi)", "rad")).toBe("-1");
    expect(ev("log(1000) + ln(e)")).toBe("4");
    expect(ev("ans * 2")).toBe("10");
    expect(ev("abs(-3) + cbrt(27)")).toBe("6");
  });

  it("rejects bad input instead of guessing", () => {
    for (const bad of ["2 +", "(1 + 2", "1 / 0", "sqrt(-1)", "alert(1)", "2 $ 3", "1 2"]) expect(() => evaluate(bad)).toThrow();
  });
});
