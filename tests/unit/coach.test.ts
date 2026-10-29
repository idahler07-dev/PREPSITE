import { describe, expect, it } from "vitest";
import { buildWeeklyPlan, mondayOf, weakestSkills } from "@/lib/coach/plan";

const base = { today: "2026-11-04", testDate: null, skills: [], dueReviews: 0, canTakeTest: true };

describe("study coach plan", () => {
  it("starts weeks on Monday", () => {
    expect(mondayOf("2026-11-04")).toBe("2026-11-02");
    expect(mondayOf("2026-11-08")).toBe("2026-11-02");
    expect(mondayOf("2026-11-02")).toBe("2026-11-02");
  });

  it("puts the weakest practised skills first, then untried ones", () => {
    const skills = [
      { skill: "TRANSITIONS", answered: 10, correct: 9 },
      { skill: "INFERENCES", answered: 10, correct: 4 },
      { skill: "LINEAR_FUNCTIONS", answered: 6, correct: 3 },
      { skill: "BOUNDARIES", answered: 1, correct: 0 },
    ];
    const w = weakestSkills(skills);
    expect(w.slice(0, 2)).toEqual(["INFERENCES", "LINEAR_FUNCTIONS"]);
    expect(w).not.toContain("TRANSITIONS");
  });

  it("without a test date: 5 study days of 30 minutes and one practice test", () => {
    const p = buildWeeklyPlan(base);
    expect(p).toMatchObject({ weekStart: "2026-11-02", minutesPerDay: 30, daysToTest: null });
    expect(p.days.filter((d) => d.tasks.some((t) => t.kind === "rest"))).toHaveLength(2);
    expect(p.days.flatMap((d) => d.tasks).filter((t) => t.kind === "mock")).toHaveLength(1);
  });

  it("schedules due reviews first and rests around the test", () => {
    const p = buildWeeklyPlan({ ...base, testDate: "2026-11-07", dueReviews: 14 });
    expect(p.minutesPerDay).toBe(60);
    const byDate = Object.fromEntries(p.days.map((d) => [d.date, d.tasks.map((t) => t.kind)]));
    expect(byDate["2026-11-02"]![0]).toBe("review");
    expect(byDate["2026-11-06"]).toEqual(["rest"]);
    expect(byDate["2026-11-07"]).toEqual(["rest"]);
    expect(byDate["2026-11-08"]).toEqual([]);
    expect(p.days.flatMap((d) => d.tasks).some((t) => t.kind === "mock")).toBe(false); // too close to the test
    expect(p.days.flatMap((d) => d.tasks).filter((t) => t.kind === "review").reduce((s, t) => s + (t.count ?? 0), 0)).toBe(14);
  });

  it("skips the practice test when the student can't take one", () => {
    const p = buildWeeklyPlan({ ...base, canTakeTest: false });
    expect(p.days.flatMap((d) => d.tasks).some((t) => t.kind === "mock")).toBe(false);
  });
});
