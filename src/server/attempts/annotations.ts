import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { HttpError } from "@/server/http";

export const HIGHLIGHT_COLORS = ["yellow", "blue", "pink"] as const;

export const annotationSchema = z.object({
  questionId: z.string().max(40),
  highlights: z
    .array(z.object({ start: z.number().int().min(0).max(20_000), end: z.number().int().min(1).max(20_000), color: z.enum(HIGHLIGHT_COLORS) }))
    .max(200)
    .refine((hs) => hs.every((h) => h.end > h.start), "end must be after start"),
  note: z.string().max(2000).nullable(),
});

export type Annotation = z.infer<typeof annotationSchema>;

async function assertQuestionInAttempt(attemptId: string, userId: string, questionId: string) {
  const r = await db.response.findFirst({
    where: { questionId, module: { attemptId, attempt: { userId } } },
    select: { id: true },
  });
  if (!r) throw new HttpError(404, "NOT_FOUND");
}

export async function saveAnnotation(attemptId: string, userId: string, raw: unknown) {
  const a = annotationSchema.parse(raw);
  await assertQuestionInAttempt(attemptId, userId, a.questionId);
  const note = a.note?.trim() || null;
  await db.annotation.upsert({
    where: { attemptId_questionId: { attemptId, questionId: a.questionId } },
    create: { attemptId, questionId: a.questionId, highlights: a.highlights as Prisma.InputJsonValue, note },
    update: { highlights: a.highlights as Prisma.InputJsonValue, note },
  });
  return { ok: true };
}

/** Annotations of an attempt the user owns, by question id. */
export async function loadAnnotations(attemptId: string, userId: string): Promise<Record<string, Omit<Annotation, "questionId">>> {
  const rows = await db.annotation.findMany({ where: { attemptId, attempt: { userId } } });
  return Object.fromEntries(rows.map((r) => [r.questionId, { highlights: r.highlights as Annotation["highlights"], note: r.note }]));
}
