import { describe, expect, it } from "vitest";
import { recurringMistakes, type NotebookEntry } from "@/lib/srs/patterns";

const e = (
  skill: string,
  reason = "WRONG",
  cause: string | null = null,
  lapses = 0,
): NotebookEntry => ({ skill, reason, cause, lapses });

describe("recurringMistakes", () => {
  it("groups wrong answers and review lapses by skill, most first", () => {
    const out = recurringMistakes([
      e("A"),
      e("A"),
      e("B"),
      e("B"),
      e("B"),
      e("C"),
    ]);
    expect(out.map((p) => [p.skill, p.count])).toEqual([
      ["B", 3],
      ["A", 2],
    ]);
  });

  it("counts lapses, and ignores bookmarks that were never missed", () => {
    const out = recurringMistakes([
      e("A", "BOOKMARK"),
      e("A", "BOOKMARK"),
      e("B", "FLAGGED", null, 2),
    ]);
    expect(out).toEqual([{ skill: "B", count: 2, cause: null }]);
  });

  it("names the most common tagged reason only when it repeats", () => {
    const out = recurringMistakes([
      e("A", "WRONG", "CARELESS"),
      e("A", "WRONG", "CARELESS"),
      e("A", "WRONG", "TIME"),
      e("B", "WRONG", "CONCEPT"),
      e("B", "WRONG", "TIME"),
    ]);
    expect(out.find((p) => p.skill === "A")?.cause).toBe("CARELESS");
    expect(out.find((p) => p.skill === "B")?.cause).toBeNull();
  });

  it("ignores unknown reasons and respects the limit", () => {
    const many = ["A", "B", "C", "D"].flatMap((s) => [
      e(s, "WRONG", "NOPE"),
      e(s),
    ]);
    const out = recurringMistakes(many, 2, 3);
    expect(out).toHaveLength(3);
    expect(out.every((p) => p.cause === null)).toBe(true);
  });
});
