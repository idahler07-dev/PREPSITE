import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export const questionFilterSchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "RETIRED"]).optional(),
  section: z.enum(["RW", "MATH"]).optional(),
  domain: z.string().max(60).optional(),
  skill: z.string().max(60).optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  source: z.string().max(40).optional(),
  flag: z.string().max(40).optional(),
  origin: z.enum(["IMPORTED", "AI_DRAFTED", "MANUAL"]).optional(),
  batch: z.string().max(40).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});

export type QuestionFilters = z.infer<typeof questionFilterSchema>;

export function parseQuestionFilters(sp: Record<string, string | string[] | undefined>): QuestionFilters {
  const flat = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v || undefined]));
  const parsed = questionFilterSchema.safeParse(flat);
  return parsed.success ? parsed.data : { page: 1 };
}

export function questionWhere(f: QuestionFilters, extra: Prisma.QuestionWhereInput = {}): Prisma.QuestionWhereInput {
  const and: Prisma.QuestionWhereInput[] = [extra];
  if (f.q) {
    and.push({
      OR: [
        { code: { contains: f.q, mode: "insensitive" } },
        { stem: { contains: f.q, mode: "insensitive" } },
        { passage: { contains: f.q, mode: "insensitive" } },
        { tags: { has: f.q } },
      ],
    });
  }
  if (f.status) and.push({ status: f.status });
  if (f.section) and.push({ section: f.section });
  if (f.domain) and.push({ domain: f.domain });
  if (f.skill) and.push({ skill: f.skill });
  if (f.difficulty) and.push({ difficulty: f.difficulty });
  if (f.source) and.push({ sourceId: f.source });
  if (f.origin) and.push({ origin: f.origin });
  if (f.batch) and.push({ importBatchId: f.batch });
  if (f.flag === "NONE") and.push({ flags: { isEmpty: true } });
  else if (f.flag) and.push({ flags: { has: f.flag } });
  return { AND: and };
}

export const PAGE_SIZE = 50;

export async function listQuestions(f: QuestionFilters, extra: Prisma.QuestionWhereInput = {}) {
  const where = questionWhere(f, extra);
  const [total, items] = await Promise.all([
    db.question.count({ where }),
    db.question.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        code: true,
        section: true,
        domain: true,
        skill: true,
        difficulty: true,
        type: true,
        status: true,
        flags: true,
        isSample: true,
        updatedAt: true,
        stem: true,
      },
    }),
  ]);
  return { total, items, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
