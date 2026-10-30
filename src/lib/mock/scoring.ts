import { routingThreshold, scoreAnchors, scoreUncertainty } from "@/config/mock-blueprint";
import type { SectionKey } from "@/lib/taxonomy";

/** Which module 2 a student gets, from their module-1 result. */
export function routeModuleTwo(correct: number, total: number): "easier" | "harder" {
  return total > 0 && correct / total >= routingThreshold ? "harder" : "easier";
}

/** Estimated section score (200–800, step 10) from the share correct on the given route. */
export function estimateSectionScore(correct: number, total: number, route: "easier" | "harder"): number {
  const anchors = scoreAnchors[route];
  const share = total > 0 ? Math.max(0, Math.min(1, correct / total)) : 0;
  let score = anchors.at(-1)![1];
  for (let i = 1; i < anchors.length; i++) {
    const [x0, y0] = anchors[i - 1]!;
    const [x1, y1] = anchors[i]!;
    if (share <= x1) {
      score = y0 + ((share - x0) / (x1 - x0 || 1)) * (y1 - y0);
      break;
    }
  }
  return Math.max(200, Math.min(800, Math.round(score / 10) * 10));
}

export interface SectionResult {
  section: SectionKey;
  route: "easier" | "harder";
  correct: number;
  total: number;
  score: number;
  low: number;
  high: number;
}

export interface ScoreEstimate {
  sections: SectionResult[];
  /** Present only when both sections were taken. */
  total: { score: number; low: number; high: number } | null;
}

export function estimateScores(sections: { section: SectionKey; route: "easier" | "harder"; correct: number; total: number }[]): ScoreEstimate {
  const results = sections.map((s) => {
    const score = estimateSectionScore(s.correct, s.total, s.route);
    return { ...s, score, low: Math.max(200, score - scoreUncertainty), high: Math.min(800, score + scoreUncertainty) };
  });
  const both = results.some((r) => r.section === "RW") && results.some((r) => r.section === "MATH");
  const sum = results.reduce((s, r) => s + r.score, 0);
  // Section errors partly cancel, so the total range is narrower than the sum of both.
  const spread = Math.round((scoreUncertainty * Math.SQRT2) / 10) * 10;
  return {
    sections: results,
    total: both ? { score: sum, low: Math.max(400, sum - spread), high: Math.min(1600, sum + spread) } : null,
  };
}
