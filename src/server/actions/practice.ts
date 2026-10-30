"use server";

import { z } from "zod";
import { requireApiUser } from "@/server/auth/session";
import { HttpError } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { countDrillMatches, createDrill } from "@/server/attempts/service";
import { reportQuestion } from "@/server/questions/service";
import { db } from "@/lib/db";

export async function countMatchingQuestions(config: unknown): Promise<number> {
  await requireApiUser();
  try {
    return await countDrillMatches(config);
  } catch {
    return 0;
  }
}

export async function startDrill(config: unknown): Promise<{ ok: true; id: string } | { ok: false; error: string; message?: string }> {
  const user = await requireApiUser();
  if (!(await rateLimit(`drill:${user.id}`, 60, 3600)).ok) return { ok: false, error: "RATE_LIMITED" };
  try {
    const attempt = await createDrill(user.id, config);
    return { ok: true, id: attempt.id };
  } catch (e) {
    if (e instanceof HttpError) return { ok: false, error: e.code, message: e.message };
    if (e instanceof z.ZodError) return { ok: false, error: "VALIDATION" };
    throw e;
  }
}

const reportSchema = z.object({
  attemptId: z.string().max(40),
  questionId: z.string().max(40),
  reason: z.enum(["WRONG_ANSWER", "TYPO", "UNCLEAR", "FIGURE", "OTHER"]),
  message: z.string().trim().max(1000).optional(),
});

/** Students may report questions they have been given in one of their own attempts. */
export async function submitQuestionReport(raw: unknown): Promise<{ ok: boolean; already?: boolean; error?: string }> {
  const user = await requireApiUser();
  const input = reportSchema.parse(raw);
  if (!(await rateLimit(`report:${user.id}`, 30, 3600)).ok) return { ok: false, error: "RATE_LIMITED" };
  const seen = await db.response.findFirst({
    where: { questionId: input.questionId, module: { attemptId: input.attemptId, attempt: { userId: user.id } } },
    select: { id: true },
  });
  if (!seen) return { ok: false, error: "NOT_FOUND" };
  const res = await reportQuestion(input.questionId, user.id, input.reason, input.message || null);
  return { ok: true, already: res.alreadyReported };
}
