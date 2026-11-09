"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/auth/session";
import { rateLimit } from "@/server/rate-limit";

const sessionSchema = z.object({
  startedAt: z.coerce.date(),
  plannedMinutes: z.number().int().min(5).max(120),
  focusedSeconds: z.number().int().min(0).max(4 * 3600),
  completed: z.boolean(),
  label: z.string().trim().max(120).optional(),
});

/**
 * Save a finished or stopped focus session. Sessions under a minute are not
 * kept. The time can't exceed the wall-clock time since the start, so a
 * tampered client can't inflate it.
 */
export async function saveFocusSession(raw: unknown): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  if (!(await rateLimit(`focus:${user.id}`, 30, 3600)).ok) return { ok: false };
  const s = sessionSchema.parse(raw);
  const now = new Date();
  const wall = Math.floor((now.getTime() - s.startedAt.getTime()) / 1000);
  if (wall < 0 || wall > 6 * 3600) return { ok: false };
  const focused = Math.min(s.focusedSeconds, wall + 5);
  if (focused < 60) return { ok: true };
  await db.focusSession.create({
    data: { userId: user.id, startedAt: s.startedAt, endedAt: now, plannedMinutes: s.plannedMinutes, focusedSeconds: focused, completed: s.completed, label: s.label || null },
  });
  revalidatePath("/focus");
  revalidatePath("/dashboard");
  return { ok: true };
}
