import { describe, expect, it } from "vitest";
import { buildWeeklyPlan, mondayOf, weakestSkills } from "@/lib/coach/plan";

const base = {
  today: "2026-11-04",
  testDate: null,
  skills: [],
  dueReviews: 0,
  canTakeTest: true,
};

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
    expect(p).toMatchObject({
      weekStart: "2026-11-02",
      minutesPerDay: 30,
      daysToTest: null,
    });
    expect(
      p.days.filter((d) => d.tasks.some((t) => t.kind === "rest")),
    ).toHaveLength(2);
    expect(
      p.days.flatMap((d) => d.tasks).filter((t) => t.kind === "mock"),
    ).toHaveLength(1);
  });

  it("schedules due reviews first and rests around the test", () => {
    const p = buildWeeklyPlan({
      ...base,
      testDate: "2026-11-07",
      dueReviews: 14,
    });
    expect(p.minutesPerDay).toBe(60);
    const byDate = Object.fromEntries(
      p.days.map((d) => [d.date, d.tasks.map((t) => t.kind)]),
    );
    expect(byDate["2026-11-02"]![0]).toBe("review");
    expect(byDate["2026-11-06"]).toEqual(["rest"]);
    expect(byDate["2026-11-07"]).toEqual(["rest"]);
    expect(byDate["2026-11-08"]).toEqual([]);
    expect(p.days.flatMap((d) => d.tasks).some((t) => t.kind === "mock")).toBe(
      false,
    ); // too close to the test
    expect(
      p.days
        .flatMap((d) => d.tasks)
        .filter((t) => t.kind === "review")
        .reduce((s, t) => s + (t.count ?? 0), 0),
    ).toBe(14);
  });

  it("skips the practice test when the student can't take one", () => {
    const p = buildWeeklyPlan({ ...base, canTakeTest: false });
    expect(p.days.flatMap((d) => d.tasks).some((t) => t.kind === "mock")).toBe(
      false,
    );
  });
});

describe("missed days roll forward", () => {
  // Wednesday; Monday and Tuesday were study days
  const wed = { ...base, today: "2026-11-04" };

  it("marks past study days without practice as missed and carries their drill time forward", () => {
    const p = buildWeeklyPlan({ ...wed, activeDays: ["2026-11-02"] });
    const tue = p.days.find((d) => d.date === "2026-11-03")!;
    const mon = p.days.find((d) => d.date === "2026-11-02")!;
    expect(tue.tasks.every((t) => t.missed)).toBe(true);
    expect(mon.tasks.some((t) => t.missed)).toBe(false);
    const carried = p.days.flatMap((d) =>
      d.tasks.filter((t) => t.carried).map((t) => ({ date: d.date, ...t })),
    );
    expect(carried.length).toBeGreaterThan(0);
    expect(carried.every((c) => c.date >= "2026-11-04")).toBe(true);
    const missedDrill = tue.tasks.find((t) => t.kind === "drill")!;
    expect(carried.reduce((s, c) => s + c.minutes, 0)).toBe(
      missedDrill.minutes,
    );
  });

  it("never adds more than half a day's minutes to one day", () => {
    const p = buildWeeklyPlan({ ...base, today: "2026-11-06", activeDays: [] });
    for (const d of p.days) {
      const extra = d.tasks
        .filter((t) => t.carried)
        .reduce((s, t) => s + t.minutes, 0);
      expect(extra).toBeLessThanOrEqual(Math.round(p.minutesPerDay / 2));
    }
  });

  it("changes nothing when practice history is not given", () => {
    const p = buildWeeklyPlan(wed);
    expect(
      p.days.flatMap((d) => d.tasks).some((t) => t.missed || t.carried),
    ).toBe(false);
  });

  it("keeps given focus skills", () => {
    const p = buildWeeklyPlan({ ...wed, focusSkills: ["BOUNDARIES"] });
    expect(p.focusSkills).toEqual(["BOUNDARIES"]);
  });
});

describe("missed work with no study day left", () => {
  it("reports the missed skills so next week can lead with them", () => {
    // Friday is the practice-test day; Mon to Thu were missed
    const p = buildWeeklyPlan({ ...base, today: "2026-11-06", activeDays: [] });
    expect(p.days.flatMap((d) => d.tasks).some((t) => t.carried)).toBe(false);
    expect(p.carryOver?.length).toBeGreaterThan(0);
    expect(p.carryOver).toEqual(
      expect.arrayContaining(p.focusSkills.slice(0, 1)),
    );
  });
});
