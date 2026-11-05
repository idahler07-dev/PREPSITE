import { describe, expect, it } from "vitest";
import { buildPath } from "@/lib/path";
import { DOMAINS } from "@/lib/taxonomy";

describe("learning path", () => {
  it("starts a new student on the first lesson with everything else locked", () => {
    const { units, current } = buildPath([]);
    expect(units).toHaveLength(DOMAINS.length);
    expect(current?.key).toBe(DOMAINS[0]!.skills[0]);
    expect(units.flatMap((u) => u.nodes).filter((n) => n.state === "current")).toHaveLength(1);
    expect(units[0]!.nodes.at(-1)!.state).toBe("locked");
  });

  it("marks a skill done only with enough answers at mastery", () => {
    const first = DOMAINS[0]!.skills[0]!;
    expect(buildPath([{ key: first, total: 5, correct: 5 }]).current?.key).toBe(first);
    expect(buildPath([{ key: first, total: 10, correct: 6 }]).current?.key).toBe(first);
    expect(buildPath([{ key: first, total: 10, correct: 8 }]).current?.key).toBe(DOMAINS[0]!.skills[1]);
  });

  it("adds a review stop in the current unit when mistakes are due", () => {
    const { units } = buildPath([], 3);
    expect(units[0]!.nodes.some((n) => n.kind === "review")).toBe(true);
    expect(units[1]!.nodes.some((n) => n.kind === "review")).toBe(false);
  });
});
