/**
 * Score calculator maths (public page /sat/score-calculator).
 *
 * How the estimate works
 * ----------------------
 * The Digital SAT has two modules per section. Module 1 decides whether you
 * get the harder or the easier module 2, and the easier route caps the
 * section score. College Board scores with item response theory and does not
 * publish a raw-to-scaled table, so nobody outside it can convert raw counts
 * exactly. We use the same table as Satify's own practice tests
 * (`scoreAnchors` in src/config/mock-blueprint.ts):
 *
 *   share correct (both modules)   harder module 2   easier module 2
 *   0%                             200               200
 *   25%                            —                 300
 *   30%                            420               —
 *   50%                            530               400
 *   70% / 75%                      640               500
 *   100%                           800               600
 *
 * Points in between are joined by straight lines and rounded to 10. Totals
 * are R&W + Math (400–1600). No percentile is shown: without official
 * score-band data it would be invented.
 *
 * Estimate only — not an official College Board score.
 */
import { estimateSectionScore, routeModuleTwo } from "@/lib/mock/scoring";
import type { SectionKey } from "@/lib/taxonomy";

export type Route = "harder" | "easier";

/** Questions per module on the Digital SAT. */
export const MODULE_SIZE: Record<SectionKey, number> = { RW: 27, MATH: 22 };

export interface SectionInput {
  m1: number;
  m2: number;
  route: Route;
}

export function clampRaw(section: SectionKey, n: number): number {
  return Math.max(0, Math.min(MODULE_SIZE[section], Math.round(n)));
}

/** The module 2 you'd most likely get from this module 1 result. */
export function likelyRoute(section: SectionKey, m1: number): Route {
  return routeModuleTwo(m1, MODULE_SIZE[section]);
}

/** Section score 200–800 from both modules' raw counts and the module 2 route. */
export function sectionScore(section: SectionKey, input: SectionInput): number {
  const size = MODULE_SIZE[section];
  const correct = clampRaw(section, input.m1) + clampRaw(section, input.m2);
  return estimateSectionScore(correct, size * 2, input.route);
}

export function totalScore(rw: SectionInput, math: SectionInput): { rw: number; math: number; total: number } {
  const r = sectionScore("RW", rw);
  const m = sectionScore("MATH", math);
  return { rw: r, math: m, total: r + m };
}

/** Fewest correct answers (both modules together) that reach `target` on a section, or null if out of reach. */
export function minCorrectFor(section: SectionKey, target: number, route: Route = "harder"): number | null {
  const n = MODULE_SIZE[section] * 2;
  for (let c = 0; c <= n; c++) if (estimateSectionScore(c, n, route) >= target) return c;
  return null;
}

export interface Plan {
  rw: { score: number; correct: number; of: number };
  math: { score: number; correct: number; of: number };
}

/**
 * Reverse mode ("What do I need for 1500?"): the split between the sections
 * that asks for the most even share of correct answers, both on the harder
 * module 2 (the only route that reaches the top scores).
 */
export function planFor(target: number): Plan | null {
  const t = Math.max(400, Math.min(1600, Math.round(target / 10) * 10));
  let best: (Plan & { gap: number }) | null = null;
  for (let rw = 200; rw <= 800; rw += 10) {
    const math = t - rw;
    if (math < 200 || math > 800) continue;
    const cr = minCorrectFor("RW", rw);
    const cm = minCorrectFor("MATH", math);
    if (cr === null || cm === null) continue;
    const gap = Math.abs(cr / (MODULE_SIZE.RW * 2) - cm / (MODULE_SIZE.MATH * 2));
    if (!best || gap < best.gap) best = { gap, rw: { score: rw, correct: cr, of: MODULE_SIZE.RW * 2 }, math: { score: math, correct: cm, of: MODULE_SIZE.MATH * 2 } };
  }
  return best ? { rw: best.rw, math: best.math } : null;
}
