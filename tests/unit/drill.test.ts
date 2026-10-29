import { describe, expect, it } from "vitest";
import { drillConfigSchema, seededRandom, selectDrillQuestions, shuffle } from "@/lib/practice/drill";

const mk = (n: number, section: "RW" | "MATH") => Array.from({ length: n }, (_, i) => ({ id: `${section}${i}`, section }));

describe("drill config", () => {
  it("applies defaults and normalizes codes", () => {
    const c = drillConfigSchema.parse({ codeFrom: " lc-m-alg-0001 " });
    expect(c).toMatchObject({ count: 10, timed: false, feedback: "IMMEDIATE", unseenFirst: true, section: null, codeFrom: "LC-M-ALG-0001" });
  });
  it("drops domains and skills that don't fit the section", () => {
    const c = drillConfigSchema.parse({ section: "MATH", domains: ["ALGEBRA", "CRAFT_AND_STRUCTURE"], skills: ["LINEAR_FUNCTIONS", "CIRCLES"] });
    expect(c.domains).toEqual(["ALGEBRA"]);
    expect(c.skills).toEqual(["LINEAR_FUNCTIONS"]);
  });
  it("drops skills from the other section when no domain is chosen", () => {
    const c = drillConfigSchema.parse({ section: "RW", skills: ["TRANSITIONS", "CIRCLES", "NOT_A_SKILL"] });
    expect(c.skills).toEqual(["TRANSITIONS"]);
  });
  it("rejects too many questions", () => {
    expect(() => drillConfigSchema.parse({ count: 500 })).toThrow();
  });
});

describe("question selection", () => {
  it("is reproducible with the same seed", () => {
    const a = shuffle(mk(20, "MATH"), seededRandom(42));
    const b = shuffle(mk(20, "MATH"), seededRandom(42));
    expect(a).toEqual(b);
    expect(shuffle(mk(20, "MATH"), seededRandom(43))).not.toEqual(a);
  });

  it("prefers unseen questions", () => {
    const cands = mk(10, "MATH");
    const seen = new Set(cands.slice(0, 7).map((c) => c.id));
    const picked = selectDrillQuestions(cands, seen, 3, { unseenFirst: true, rand: seededRandom(1) });
    expect(picked.every((p) => !seen.has(p.id))).toBe(true);
  });

  it("falls back to seen questions when there are not enough unseen ones", () => {
    const cands = mk(5, "MATH");
    const seen = new Set(cands.slice(0, 4).map((c) => c.id));
    const picked = selectDrillQuestions(cands, seen, 5, { unseenFirst: true, rand: seededRandom(1) });
    expect(picked).toHaveLength(5);
    expect(picked[0]!.id).toBe("MATH4");
  });

  it("never repeats a question and orders R&W before Math", () => {
    const picked = selectDrillQuestions([...mk(10, "MATH"), ...mk(10, "RW")], new Set(), 12, { unseenFirst: false, rand: seededRandom(7) });
    expect(new Set(picked.map((p) => p.id)).size).toBe(12);
    const firstMath = picked.findIndex((p) => p.section === "MATH");
    expect(picked.slice(firstMath).every((p) => p.section === "MATH")).toBe(true);
  });

  it("returns fewer when the pool is small", () => {
    expect(selectDrillQuestions(mk(3, "RW"), new Set(), 10, { unseenFirst: true, rand: seededRandom(1) })).toHaveLength(3);
  });
});
