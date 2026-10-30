/**
 * SM-2 spaced repetition (SuperMemo 2), used by the mistake notebook and
 * vocabulary cards. Quality: 0–5 (below 3 = forgot).
 */
export interface SrsState {
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
}

export const NEW_CARD: SrsState = { ease: 2.5, intervalDays: 0, repetitions: 0, lapses: 0 };
/** Items reviewed correctly with an interval longer than this are considered learned. */
export const LEARNED_AFTER_DAYS = 60;

const DAY = 86_400_000;

export function review(state: SrsState, quality: number, now = new Date()): SrsState & { dueAt: Date } {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  let { ease, intervalDays, repetitions, lapses } = state;
  if (q < 3) {
    repetitions = 0;
    intervalDays = 1;
    lapses += 1;
  } else {
    intervalDays = repetitions === 0 ? 1 : repetitions === 1 ? 6 : Math.round(intervalDays * ease);
    repetitions += 1;
  }
  ease = Math.max(1.3, Math.round((ease + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)) * 100) / 100);
  return { ease, intervalDays, repetitions, lapses, dueAt: new Date(now.getTime() + intervalDays * DAY) };
}

/** Practice answers map to SM-2 quality: right = 4, wrong = 1. */
export const qualityForAnswer = (correct: boolean) => (correct ? 4 : 1);

/** Flashcard buttons. */
export const CARD_GRADES = { again: 1, hard: 3, good: 4, easy: 5 } as const;
export type CardGrade = keyof typeof CARD_GRADES;
