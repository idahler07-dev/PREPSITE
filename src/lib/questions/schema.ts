import { z } from "zod";
import { isValidDomain, isValidSkill } from "@/lib/taxonomy";
import { CODE_PATTERN, normalizeCode } from "./codes";

export const CHOICE_KEYS = ["A", "B", "C", "D"] as const;
export type ChoiceKey = (typeof CHOICE_KEYS)[number];

export const choiceSchema = z.object({
  key: z.enum(CHOICE_KEYS),
  text: z.string().max(5000),
});
export type Choice = z.infer<typeof choiceSchema>;

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .nullish()
    .transform((v) => (v && v.trim() ? v : null));

/**
 * What an editor submits. Drafts may be incomplete (missing answer, fewer
 * choices...) — those become review flags, not validation errors.
 */
export const questionInputSchema = z
  .object({
    code: z
      .string()
      .transform(normalizeCode)
      .pipe(z.string().regex(CODE_PATTERN, "INVALID_CODE")),
    section: z.enum(["RW", "MATH"]),
    domain: z.string().min(1),
    skill: z.string().min(1),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
    type: z.enum(["MCQ", "SPR"]),
    passage: optionalText(20000),
    stem: z.string().trim().min(1, "REQUIRED").max(20000),
    choices: z.array(choiceSchema).max(4).nullish(),
    correctAnswers: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
    explanation: optionalText(20000),
    wrongChoiceRationales: z.partialRecord(z.enum(CHOICE_KEYS), z.string().max(5000)).nullish(),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
    sourceId: z.string().nullish(),
  })
  .superRefine((q, ctx) => {
    if (!isValidDomain(q.section, q.domain)) ctx.addIssue({ code: "custom", path: ["domain"], message: "INVALID_DOMAIN" });
    else if (!isValidSkill(q.domain, q.skill)) ctx.addIssue({ code: "custom", path: ["skill"], message: "INVALID_SKILL" });
  })
  .transform((q) => ({
    ...q,
    choices: q.type === "MCQ" ? (q.choices ?? []) : null,
    correctAnswers: q.type === "MCQ" ? q.correctAnswers.map((a) => a.toUpperCase()) : q.correctAnswers,
    wrongChoiceRationales:
      q.type === "MCQ" && q.wrongChoiceRationales
        ? Object.fromEntries(Object.entries(q.wrongChoiceRationales).filter(([, v]) => v && v.trim()))
        : null,
  }));

export type QuestionInput = z.output<typeof questionInputSchema>;
export type QuestionFormValues = z.input<typeof questionInputSchema>;
