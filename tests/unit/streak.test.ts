import { describe, expect, it } from "vitest";
import { computeStreak, dayInZone } from "@/lib/stats/streak";

describe("streaks", () => {
  it("counts consecutive days ending today", () => {
    expect(computeStreak(["2026-10-29", "2026-10-28", "2026-10-27", "2026-10-25"], "2026-10-29")).toBe(3);
  });
  it("keeps yesterday's streak alive until today ends", () => {
    expect(computeStreak(["2026-10-28", "2026-10-27"], "2026-10-29")).toBe(2);
  });
  it("is zero after a missed day", () => {
    expect(computeStreak(["2026-10-27"], "2026-10-29")).toBe(0);
    expect(computeStreak([], "2026-10-29")).toBe(0);
  });
  it("crosses month and year boundaries", () => {
    expect(computeStreak(["2027-01-01", "2026-12-31", "2026-12-30"], "2027-01-01")).toBe(3);
  });
  it("uses the user's time zone for the day", () => {
    const lateEvening = new Date("2026-10-29T20:30:00Z"); // 01:30 next day in Tashkent (UTC+5)
    expect(dayInZone(lateEvening, "Asia/Tashkent")).toBe("2026-10-30");
    expect(dayInZone(lateEvening, "UTC")).toBe("2026-10-29");
  });
});
