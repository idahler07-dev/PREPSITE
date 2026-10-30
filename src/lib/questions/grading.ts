import { isSprCorrect } from "./spr";

export type GradableType = "MCQ" | "SPR";

export interface Gradable {
  type: GradableType;
  correctAnswers: readonly string[];
}

/** Grade one answer. Unanswered (null/empty) is always incorrect. */
export function gradeAnswer(q: Gradable, answer: string | null | undefined): boolean {
  if (answer == null || answer.trim() === "") return false;
  if (q.type === "MCQ") {
    const a = answer.trim().toUpperCase();
    return q.correctAnswers.some((c) => c.trim().toUpperCase() === a);
  }
  return isSprCorrect(answer, q.correctAnswers);
}
