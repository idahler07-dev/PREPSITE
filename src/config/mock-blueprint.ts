import type { SectionKey } from "@/lib/taxonomy";

/**
 * How full practice tests are assembled and scored. Change it here, not in code.
 * Module sizes and times are in test-structure.ts.
 *
 * Domain counts follow the published proportions of the digital SAT
 * (Reading and Writing: 4 domains; Math: 4 domains). Difficulty targets are
 * fractions of a module and are rounded so the counts add up.
 */

export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type ModuleVariant = "standard" | "easier" | "harder";

export interface SectionBlueprint {
  /** Questions per domain in one module (must add up to the module size). */
  domainCounts: Record<string, number>;
}

export const sectionBlueprints: Record<SectionKey, SectionBlueprint> = {
  RW: {
    domainCounts: {
      CRAFT_AND_STRUCTURE: 7,
      INFORMATION_AND_IDEAS: 7,
      STANDARD_ENGLISH_CONVENTIONS: 7,
      EXPRESSION_OF_IDEAS: 6,
    },
  },
  MATH: {
    domainCounts: {
      ALGEBRA: 7,
      ADVANCED_MATH: 7,
      PROBLEM_SOLVING_AND_DATA_ANALYSIS: 4,
      GEOMETRY_AND_TRIGONOMETRY: 4,
    },
  },
};

/** Difficulty mix per module variant. Module 1 is always "standard". */
export const difficultyMix: Record<ModuleVariant, Record<Difficulty, number>> = {
  standard: { EASY: 0.34, MEDIUM: 0.33, HARD: 0.33 },
  easier: { EASY: 0.5, MEDIUM: 0.35, HARD: 0.15 },
  harder: { EASY: 0.15, MEDIUM: 0.35, HARD: 0.5 },
};

/** Module 2 is the harder one when at least this share of module 1 is correct. */
export const routingThreshold = 0.6;

/**
 * Our estimated section score (200–800) from the share of questions answered
 * correctly across both modules, by the module-2 route. Points between the
 * anchors are joined by straight lines and rounded to the nearest 10.
 *
 * This is our own estimate, not an official College Board conversion. Tune it
 * as you collect results from students who later sit the real test.
 */
export const scoreAnchors: Record<"easier" | "harder", [share: number, score: number][]> = {
  easier: [
    [0, 200],
    [0.25, 300],
    [0.5, 400],
    [0.75, 500],
    [1, 600],
  ],
  harder: [
    [0, 200],
    [0.3, 420],
    [0.5, 530],
    [0.7, 640],
    [0.85, 720],
    [1, 800],
  ],
};

/** Half-width of the range shown around an estimate (e.g. 540 ± 40). */
export const scoreUncertainty = 40;
