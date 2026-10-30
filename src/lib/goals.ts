import { z } from "zod";

/** SAT total scores run 400–1600 in steps of 10. */
export const scoreSchema = z.coerce.number().int().min(400).max(1600).refine((n) => n % 10 === 0);

const optionalScore = z
  .union([z.literal(""), z.null(), z.undefined(), scoreSchema])
  .transform((v) => (v === "" || v == null ? null : Number(v)));

export const goalSchema = z.object({
  testDate: z
    .union([z.literal(""), z.null(), z.undefined(), z.iso.date()])
    .transform((v) => (v ? new Date(`${v}T00:00:00Z`) : null)),
  targetScore: optionalScore,
  currentScore: optionalScore,
});

export type GoalInput = z.infer<typeof goalSchema>;

export function daysUntil(date: Date, now = new Date()): number {
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const end = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.round((end - start) / 86_400_000);
}
