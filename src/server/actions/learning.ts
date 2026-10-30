"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireApiUser } from "@/server/auth/session";
import { HttpError } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { removeFromNotebook, saveQuestionNote, startDailyQuestion, startReview } from "@/server/review/service";
import { gradeWord } from "@/server/vocab/service";
import { generatePlan } from "@/server/coach/service";
import { db } from "@/lib/db";
import { DOMAINS } from "@/lib/taxonomy";

const isKnownSkill = (k: string) => DOMAINS.some((d) => (d.skills as readonly string[]).includes(k));

type Result<T> = { ok: true; data: T } | { ok: false; error: string; message?: string };

async function run<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof HttpError) return { ok: false, error: e.code, message: e.message };
    if (e instanceof z.ZodError) return { ok: false, error: "VALIDATION" };
    console.error(e);
    return { ok: false, error: "INTERNAL" };
  }
}

export async function startReviewSession(raw: unknown) {
  return run(async () => {
    const user = await requireApiUser();
    if (!(await rateLimit(`review:${user.id}`, 60, 3600)).ok) throw new HttpError(429, "RATE_LIMITED");
    return (await startReview(user.id, raw)).id;
  });
}

export async function openDailyQuestion() {
  return run(async () => {
    const user = await requireApiUser();
    return (await startDailyQuestion(user.id)).id;
  });
}

export async function updateQuestionNote(raw: unknown) {
  return run(async () => {
    const user = await requireApiUser();
    if (!(await rateLimit(`note:${user.id}`, 300, 3600)).ok) throw new HttpError(429, "RATE_LIMITED");
    await saveQuestionNote(user.id, raw);
    return null;
  });
}

export async function removeNotebookItem(questionId: string) {
  return run(async () => {
    const user = await requireApiUser();
    await removeFromNotebook(user.id, z.string().max(40).parse(questionId));
    revalidatePath("/review", "page");
    return null;
  });
}

// ─── Vocabulary, official scores, study plan ────────────────────────────────

export async function gradeVocabCard(raw: unknown) {
  return run(async () => {
    const user = await requireApiUser();
    if (!(await rateLimit(`vocab:${user.id}`, 600, 3600)).ok) throw new HttpError(429, "RATE_LIMITED");
    return gradeWord(user.id, raw);
  });
}

const scoreSchema = z
  .object({
    testName: z.string().trim().min(1).max(80),
    takenOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    rw: z.coerce.number().int().min(200).max(800).multipleOf(10),
    math: z.coerce.number().int().min(200).max(800).multipleOf(10),
    missedSkills: z.array(z.string().max(60)).max(40).default([]),
  })
  .refine((s) => new Date(`${s.takenOn}T00:00:00Z`) <= new Date(), { message: "FUTURE_DATE" });

export async function logOfficialScore(raw: unknown) {
  return run(async () => {
    const user = await requireApiUser();
    const s = scoreSchema.parse(raw);
    const skills = s.missedSkills.filter((k) => isKnownSkill(k));
    await db.officialScore.create({
      data: { userId: user.id, testName: s.testName, takenOn: new Date(`${s.takenOn}T00:00:00Z`), rw: s.rw, math: s.math, total: s.rw + s.math, missedSkills: skills },
    });
    await generatePlan(user.id, "official-score").catch(() => null);
    revalidatePath("/resources", "page");
    return null;
  });
}

export async function deleteOfficialScore(id: string) {
  return run(async () => {
    const user = await requireApiUser();
    await db.officialScore.deleteMany({ where: { id: z.string().max(40).parse(id), userId: user.id } });
    revalidatePath("/resources", "page");
    return null;
  });
}

export async function refreshStudyPlan() {
  return run(async () => {
    const user = await requireApiUser();
    if (!(await rateLimit(`plan:${user.id}`, 5, 3600)).ok) throw new HttpError(429, "RATE_LIMITED");
    await generatePlan(user.id, "manual", { withMessage: true });
    revalidatePath("/plan", "page");
    return null;
  });
}
