"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireApiOwner } from "@/server/auth/session";
import { HttpError } from "@/server/http";
import { audit } from "@/server/audit";
import { rateLimit } from "@/server/rate-limit";
import { requestDrafts } from "@/server/ai/draft-questions";

export async function startAiDrafts(raw: unknown): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const user = await requireApiOwner();
    if (!(await rateLimit(`ai-draft:${user.id}`, 20, 3600)).ok) throw new HttpError(429, "RATE_LIMITED");
    const batch = await requestDrafts(raw, user);
    await audit(user.id, "ai.draft.request", "AiDraftBatch", batch.id, { skill: batch.skill, count: batch.count });
    revalidatePath("/manage/ai-drafts", "page");
    return { ok: true, id: batch.id };
  } catch (e) {
    if (e instanceof HttpError) return { ok: false, error: e.code };
    if (e instanceof z.ZodError) return { ok: false, error: "VALIDATION" };
    console.error(e);
    return { ok: false, error: "INTERNAL" };
  }
}
