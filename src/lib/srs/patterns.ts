/**
 * Recurring mistakes in the notebook: the skills a student keeps getting wrong,
 * and why (the reason they tagged most often). Pure, so it is easy to test.
 */
export const MISTAKE_CAUSES = [
  "CONCEPT",
  "CARELESS",
  "MISREAD",
  "TIME",
  "GUESS",
] as const;
export type MistakeCause = (typeof MISTAKE_CAUSES)[number];

export interface NotebookEntry {
  skill: string;
  /** WRONG | FLAGGED | BOOKMARK */
  reason: string;
  cause: string | null;
  /** Times it was wrong again in review. */
  lapses: number;
}

export interface MistakePattern {
  skill: string;
  /** Mistakes on this skill (each wrong answer and each lapse in review counts). */
  count: number;
  /** The most common tagged reason, when at least two are tagged the same. */
  cause: MistakeCause | null;
}

/** Skills with at least `min` mistakes, most first (ties: the more tagged first), at most `limit`. */
export function recurringMistakes(
  entries: NotebookEntry[],
  min = 2,
  limit = 3,
): MistakePattern[] {
  const by = new Map<string, { count: number; causes: Map<string, number> }>();
  for (const e of entries) {
    if (e.reason !== "WRONG" && e.lapses === 0) continue;
    const s = by.get(e.skill) ?? { count: 0, causes: new Map() };
    s.count += (e.reason === "WRONG" ? 1 : 0) + e.lapses;
    if (e.cause && (MISTAKE_CAUSES as readonly string[]).includes(e.cause))
      s.causes.set(e.cause, (s.causes.get(e.cause) ?? 0) + 1);
    by.set(e.skill, s);
  }
  const out: (MistakePattern & { tagged: number })[] = [];
  for (const [skill, s] of by) {
    if (s.count < min) continue;
    let cause: MistakeCause | null = null;
    let best = 1;
    for (const [c, n] of s.causes)
      if (n > best) ((best = n), (cause = c as MistakeCause));
    out.push({
      skill,
      count: s.count,
      cause,
      tagged: [...s.causes.values()].reduce((a, b) => a + b, 0),
    });
  }
  return out
    .sort(
      (a, b) =>
        b.count - a.count ||
        b.tagged - a.tagged ||
        a.skill.localeCompare(b.skill),
    )
    .slice(0, limit)
    .map(({ skill, count, cause }) => ({ skill, count, cause }));
}
