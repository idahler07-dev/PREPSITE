/**
 * Question calibration from real answers. A question needs enough answers
 * before it is judged; then its accuracy is compared with the band expected
 * for its difficulty label, and multiple-choice questions are checked for a
 * wrong choice that is more popular than the right one (often a sign of an
 * ambiguous question or a wrong key).
 */
export const MIN_ANSWERS = 30;

/** Expected share of correct answers per label. Tune with real data. */
export const EXPECTED_ACCURACY = {
  EASY: { min: 0.65, max: 1 },
  MEDIUM: { min: 0.35, max: 0.85 },
  HARD: { min: 0, max: 0.6 },
} as const;

export type Calibration =
  | { status: "insufficient"; answers: number }
  | { status: "ok" | "tooEasy" | "tooHard"; answers: number; accuracy: number; suggested: "EASY" | "MEDIUM" | "HARD"; suspectChoice: string | null };

export function suggestDifficulty(accuracy: number): "EASY" | "MEDIUM" | "HARD" {
  return accuracy >= 0.75 ? "EASY" : accuracy >= 0.45 ? "MEDIUM" : "HARD";
}

export function calibrate(q: {
  difficulty: "EASY" | "MEDIUM" | "HARD";
  type: "MCQ" | "SPR";
  correctAnswers: readonly string[];
  /** Answer → count, for graded, non-blank answers. */
  answers: Record<string, number>;
}): Calibration {
  const total = Object.values(q.answers).reduce((s, n) => s + n, 0);
  if (total < MIN_ANSWERS) return { status: "insufficient", answers: total };
  const correctKeys = new Set(q.type === "MCQ" ? q.correctAnswers.map((a) => a.toUpperCase()) : q.correctAnswers);
  let correct = 0;
  let suspectChoice: string | null = null;
  let suspectCount = 0;
  for (const [ans, n] of Object.entries(q.answers)) {
    const key = q.type === "MCQ" ? ans.toUpperCase() : ans;
    if (correctKeys.has(key)) correct += n;
    else if (q.type === "MCQ" && n > suspectCount) {
      suspectCount = n;
      suspectChoice = key;
    }
  }
  const accuracy = correct / total;
  const band = EXPECTED_ACCURACY[q.difficulty];
  const status = accuracy > band.max ? "tooEasy" : accuracy < band.min ? "tooHard" : "ok";
  return { status, answers: total, accuracy, suggested: suggestDifficulty(accuracy), suspectChoice: suspectCount > correct ? suspectChoice : null };
}
