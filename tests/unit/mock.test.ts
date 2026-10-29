import { describe, expect, it } from "vitest";
import { apportion, assembleMock, type MockCandidate } from "@/lib/mock/assemble";
import { estimateScores, estimateSectionScore, routeModuleTwo } from "@/lib/mock/scoring";
import { sectionBlueprints } from "@/config/mock-blueprint";

const DIFFS = ["EASY", "MEDIUM", "HARD"] as const;

/** `per` questions for every domain × difficulty of both sections. */
function bank(per: number): MockCandidate[] {
  const out: MockCandidate[] = [];
  for (const section of ["RW", "MATH"] as const)
    for (const domain of Object.keys(sectionBlueprints[section].domainCounts))
      for (const difficulty of DIFFS) for (let i = 0; i < per; i++) out.push({ id: `${section}-${domain}-${difficulty}-${i}`, section, domain, difficulty });
  return out;
}

const size = { RW: 27, MATH: 22 };
const byId = (b: MockCandidate[]) => new Map(b.map((c) => [c.id, c]));

describe("apportion", () => {
  it("splits totals so parts add up", () => {
    expect(apportion(7, { EASY: 0.34, MEDIUM: 0.33, HARD: 0.33 })).toEqual({ EASY: 3, MEDIUM: 2, HARD: 2 });
    expect(apportion(6, { EASY: 0.5, MEDIUM: 0.35, HARD: 0.15 })).toEqual({ EASY: 3, MEDIUM: 2, HARD: 1 });
    const parts = apportion(22, sectionBlueprints.MATH.domainCounts);
    expect(Object.values(parts).reduce((s, n) => s + n, 0)).toBe(22);
  });
});

describe("mock assembly", () => {
  it("builds module 1 and both module-2 variants per section, matching the blueprint", () => {
    const b = bank(10);
    const { modules, missing, shortfalls } = assembleMock(b, { sections: ["RW", "MATH"], moduleSize: size, seed: 1 });
    expect(missing).toBe(0);
    expect(shortfalls).toEqual([]);
    expect(modules.map((m) => `${m.section}${m.moduleNumber}${m.variant}`)).toEqual(["RW1standard", "RW2harder", "RW2easier", "MATH1standard", "MATH2harder", "MATH2easier"]);
    const map = byId(b);
    for (const m of modules) {
      expect(m.questionIds).toHaveLength(size[m.section]);
      const domains: Record<string, number> = {};
      for (const id of m.questionIds) domains[map.get(id)!.domain] = (domains[map.get(id)!.domain] ?? 0) + 1;
      expect(domains).toEqual(sectionBlueprints[m.section].domainCounts);
    }
    const hard = (v: string) => modules.find((m) => m.section === "MATH" && m.variant === v)!.questionIds.filter((id) => map.get(id)!.difficulty === "HARD").length;
    expect(hard("harder")).toBeGreaterThan(hard("easier"));
    // No question twice in one test.
    const all = modules.flatMap((m) => m.questionIds);
    expect(new Set(all).size).toBe(all.length);
  });

  it("is reproducible from the seed and independent of input order", () => {
    const b = bank(10);
    const one = assembleMock(b, { sections: ["MATH"], moduleSize: size, seed: 42 });
    const two = assembleMock([...b].reverse(), { sections: ["MATH"], moduleSize: size, seed: 42 });
    const other = assembleMock(b, { sections: ["MATH"], moduleSize: size, seed: 43 });
    expect(two.modules).toEqual(one.modules);
    expect(other.modules).not.toEqual(one.modules);
  });

  it("prefers questions the student has not seen", () => {
    const b = bank(10);
    const seen = new Set(b.filter((c) => c.section === "MATH" && !c.id.endsWith("-9") && !c.id.endsWith("-8") && !c.id.endsWith("-7")).map((c) => c.id));
    const { modules } = assembleMock(b, { sections: ["MATH"], moduleSize: size, seed: 3, moduleOneOnly: true });
    const { modules: fresh } = assembleMock(b, { sections: ["MATH"], moduleSize: size, seed: 3, moduleOneOnly: true, seen });
    expect(fresh[0]!.questionIds.filter((id) => seen.has(id)).length).toBe(0);
    expect(modules[0]!.questionIds).toHaveLength(22);
  });

  it("substitutes nearby difficulties and reports what is missing when the bank is small", () => {
    const b = bank(1); // 12 per section: not enough for 3 modules
    const res = assembleMock(b, { sections: ["MATH"], moduleSize: size, seed: 5 });
    expect(res.missing).toBe(66 - 12);
    expect(res.shortfalls.length).toBeGreaterThan(0);
    expect(new Set(res.modules.flatMap((m) => m.questionIds)).size).toBe(12);
  });
});

describe("routing and scoring", () => {
  it("routes by the module-1 share correct", () => {
    expect(routeModuleTwo(17, 27)).toBe("harder");
    expect(routeModuleTwo(16, 27)).toBe("easier");
    expect(routeModuleTwo(0, 0)).toBe("easier");
  });

  it("interpolates the anchor table and caps the easier route", () => {
    expect(estimateSectionScore(0, 54, "harder")).toBe(200);
    expect(estimateSectionScore(54, 54, "harder")).toBe(800);
    expect(estimateSectionScore(54, 54, "easier")).toBe(600);
    expect(estimateSectionScore(27, 54, "harder")).toBe(530);
    expect(estimateSectionScore(30, 44, "harder") % 10).toBe(0);
  });

  it("adds a total only when both sections were taken", () => {
    const both = estimateScores([
      { section: "RW", route: "harder", correct: 27, total: 54 },
      { section: "MATH", route: "harder", correct: 44, total: 44 },
    ]);
    expect(both.total).toEqual({ score: 1330, low: 1270, high: 1390 });
    expect(estimateScores([{ section: "MATH", route: "easier", correct: 10, total: 44 }]).total).toBeNull();
  });
});
