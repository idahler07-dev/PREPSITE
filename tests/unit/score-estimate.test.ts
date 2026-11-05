import { describe, expect, it } from "vitest";
import { minCorrectFor, planFor, sectionScore, totalScore } from "@/lib/scoreEstimate";

describe("score calculator", () => {
  it("spans 400–1600 and caps the easier route", () => {
    expect(totalScore({ m1: 0, m2: 0, route: "easier" }, { m1: 0, m2: 0, route: "easier" }).total).toBe(400);
    expect(totalScore({ m1: 27, m2: 27, route: "harder" }, { m1: 22, m2: 22, route: "harder" }).total).toBe(1600);
    expect(sectionScore("RW", { m1: 27, m2: 27, route: "easier" })).toBe(600);
  });

  it("never goes down when you get one more right", () => {
    let prev = 0;
    for (let m2 = 0; m2 <= 22; m2++) {
      const s = sectionScore("MATH", { m1: 15, m2, route: "harder" });
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
  });

  it("reverse mode reaches the target", () => {
    const plan = planFor(1500)!;
    expect(plan.rw.score + plan.math.score).toBe(1500);
    expect(sectionScore("RW", { m1: plan.rw.correct, m2: 0, route: "harder" })).toBeLessThanOrEqual(plan.rw.score);
    expect(minCorrectFor("MATH", 800)).toBe(44);
  });
});
