"use server";

import { z } from "zod";
import { clientIp } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { checkFeatured } from "@/server/landing";

const schema = z.object({ questionId: z.string().max(40), key: z.enum(["A", "B", "C", "D"]) });

/** Landing page demo question. // public: works for visitors; only answers today's featured question. */
export async function checkLandingAnswer(raw: unknown) {
  // public: the landing card is for signed-out visitors.
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false as const };
  if (!(await rateLimit(`landing-check:${await clientIp()}`, 60, 3600)).ok) return { ok: false as const };
  const res = await checkFeatured(parsed.data.questionId, parsed.data.key);
  return res ? { ok: true as const, ...res } : { ok: false as const };
}
