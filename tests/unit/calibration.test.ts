import { describe, expect, it } from "vitest";
import { calibrate } from "@/lib/analytics/calibration";

describe("question calibration", () => {
  it("waits for enough answers", () => {
    expect(calibrate({ difficulty: "HARD", type: "MCQ", correctAnswers: ["B"], answers: { B: 20 } })).toEqual({ status: "insufficient", answers: 20 });
  });
  it("flags labels that don't match student accuracy", () => {
    expect(calibrate({ difficulty: "HARD", type: "MCQ", correctAnswers: ["B"], answers: { B: 36, A: 4 } })).toMatchObject({ status: "tooEasy", suggested: "EASY", accuracy: 0.9 });
    expect(calibrate({ difficulty: "EASY", type: "SPR", correctAnswers: ["3/4", ".75"], answers: { "3/4": 5, ".75": 5, "4/3": 30 } })).toMatchObject({ status: "tooHard", suggested: "HARD" });
    expect(calibrate({ difficulty: "MEDIUM", type: "MCQ", correctAnswers: ["c"], answers: { C: 20, A: 10, B: 10 } })).toMatchObject({ status: "ok", suspectChoice: null });
  });
  it("spots a wrong choice that beats the keyed answer", () => {
    expect(calibrate({ difficulty: "HARD", type: "MCQ", correctAnswers: ["B"], answers: { B: 10, D: 22, A: 3 } })).toMatchObject({ suspectChoice: "D" });
  });
});
