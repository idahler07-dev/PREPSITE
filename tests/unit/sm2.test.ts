import { describe, expect, it } from "vitest";
import { NEW_CARD, review } from "@/lib/srs/sm2";

const now = new Date("2026-11-01T00:00:00Z");
const days = (d: Date) => Math.round((d.getTime() - now.getTime()) / 86_400_000);

describe("SM-2", () => {
  it("grows intervals 1 → 6 → interval × ease on success", () => {
    const a = review(NEW_CARD, 4, now);
    expect(a).toMatchObject({ intervalDays: 1, repetitions: 1, ease: 2.5 });
    expect(days(a.dueAt)).toBe(1);
    const b = review(a, 4, now);
    expect(b).toMatchObject({ intervalDays: 6, repetitions: 2 });
    const c = review(b, 5, now);
    expect(c.intervalDays).toBe(Math.round(6 * 2.5));
    expect(c.ease).toBe(2.6);
  });
  it("resets on a lapse and lowers ease, never below 1.3", () => {
    let s = review(review(NEW_CARD, 4, now), 4, now);
    s = review(s, 1, now);
    expect(s).toMatchObject({ repetitions: 0, intervalDays: 1, lapses: 1 });
    expect(s.ease).toBeLessThan(2.5);
    for (let i = 0; i < 20; i++) s = review(s, 0, now);
    expect(s.ease).toBe(1.3);
  });
  it("hard answers keep the card but lower ease", () => {
    const s = review(NEW_CARD, 3, now);
    expect(s).toMatchObject({ repetitions: 1, intervalDays: 1 });
    expect(s.ease).toBe(2.36);
  });
});
