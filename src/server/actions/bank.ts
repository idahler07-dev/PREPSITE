"use server";

import { z } from "zod";
import { requireApiUser } from "@/server/auth/session";
import { createDrill } from "@/server/attempts/service";
import { bankFiltersSchema, getBankPracticeIds } from "@/server/bank/query";
import { HttpError } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";

const inputSchema = z.object({
  mode: z.enum(["one", "these", "mistakes"]),
  questionId: z.string().max(40).optional(),
  filters: z.record(z.string(), z.string().max(100)).default({}),
  /** The bank URL with its filters, for "Back to bank". */
  returnTo: z.string().max(500),
});

/** Start a drill from the question bank: one question, the current page, or my mistakes under the current filters. */
export async function practiceFromBank(raw: unknown): Promise<{ ok: true; id: string } | { ok: false; error: string; message?: string }> {
  const user = await requireApiUser();
  if (!(await rateLimit(`drill:${user.id}`, 60, 3600)).ok) return { ok: false, error: "RATE_LIMITED" };
  try {
    const input = inputSchema.parse(raw);
    const ids =
      input.mode === "one" ? (input.questionId ? [input.questionId] : []) : await getBankPracticeIds(user.id, bankFiltersSchema.parse(input.filters), input.mode);
    if (!ids.length) return { ok: false, error: "NO_QUESTIONS" };
    const attempt = await createDrill(user.id, { questionIds: ids, count: ids.length, feedback: "IMMEDIATE", returnTo: input.returnTo });
    return { ok: true, id: attempt.id };
  } catch (e) {
    if (e instanceof HttpError) return { ok: false, error: e.code, message: e.message };
    if (e instanceof z.ZodError) return { ok: false, error: "VALIDATION" };
    throw e;
  }
}
