/**
 * Limits on AI features per user. Cached tutor answers are free and don't count.
 * Plans (Phase 5) decide which tier a student is on.
 */
export type AiTier = "free" | "premium" | "staff";

export const aiLimits = {
  /** New AI tutor answers (explanations, hints, follow-up replies) per day, in the site time zone. */
  tutorPerDay: { free: 10, premium: 100, staff: 500 } satisfies Record<AiTier, number>,
  /** Burst limit across all tutor requests. */
  tutorPerMinute: 6,
  /** Follow-up messages a student can send about one question. */
  chatTurnsPerQuestion: 8,
  chatMessageMaxChars: 600,
  /** AI-drafted questions an editor can request in one batch. */
  draftBatchMax: 20,
};
