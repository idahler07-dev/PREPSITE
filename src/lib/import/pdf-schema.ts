import { z } from "zod";
import { ALL_SKILLS, DOMAINS } from "@/lib/taxonomy";

/**
 * What we extract from one PDF page. Produced either by Claude (reading the
 * page image + text layer) or by the text-layer parser (typed PDFs, no AI).
 * Stored on ImportPage.result.
 */

const DOMAIN_KEYS = DOMAINS.map((d) => d.key) as [string, ...string[]];
const SKILL_KEYS = ALL_SKILLS as [string, ...string[]];
const PLACEMENTS = ["passage", "stem", "A", "B", "C", "D", "explanation"] as const;

export const figureSchema = z.object({
  /** [left, top, right, bottom] as fractions of the page width/height (0..1). */
  box: z.array(z.number()).length(4),
  placement: z.enum(PLACEMENTS),
  description: z.string(),
});

export const extractedQuestionSchema = z.object({
  /** The number printed on the page, e.g. "12". Null when the question continues from the previous page without a number. */
  number: z.string().nullable(),
  continuesFromPreviousPage: z.boolean(),
  continuesOnNextPage: z.boolean(),
  type: z.enum(["MCQ", "SPR"]),
  passage: z.string().nullable(),
  stem: z.string(),
  choices: z.array(z.object({ key: z.enum(["A", "B", "C", "D"]), text: z.string() })),
  /** Answer printed on the page next to the question (rare in question booklets). */
  answer: z.string().nullable(),
  explanation: z.string().nullable(),
  figures: z.array(figureSchema),
  suggestedDomain: z.enum(DOMAIN_KEYS).nullable(),
  suggestedSkill: z.enum(SKILL_KEYS).nullable(),
});

export const answerKeyEntrySchema = z.object({
  /** Optional label such as "Module 1" or "Math" when the key has several parts. */
  part: z.string().nullable(),
  number: z.string(),
  answer: z.string(),
  explanation: z.string().nullable(),
});

export const pageExtractionSchema = z.object({
  pageType: z.enum(["questions", "answer_key", "mixed", "other"]),
  questions: z.array(extractedQuestionSchema),
  answerKey: z.array(answerKeyEntrySchema),
});

export type ExtractedFigure = z.infer<typeof figureSchema>;
export type ExtractedQuestion = z.infer<typeof extractedQuestionSchema>;
export type AnswerKeyEntry = z.infer<typeof answerKeyEntrySchema>;
export type PageExtraction = z.infer<typeof pageExtractionSchema>;

const nullable = (schema: object) => ({ anyOf: [schema, { type: "null" }] });

/**
 * JSON Schema for Claude's structured output. Kept within the supported
 * subset (no length/numeric constraints); zod re-validates the response.
 */
export const pageExtractionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["pageType", "questions", "answerKey"],
  properties: {
    pageType: { type: "string", enum: ["questions", "answer_key", "mixed", "other"] },
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "number",
          "continuesFromPreviousPage",
          "continuesOnNextPage",
          "type",
          "passage",
          "stem",
          "choices",
          "answer",
          "explanation",
          "figures",
          "suggestedDomain",
          "suggestedSkill",
        ],
        properties: {
          number: nullable({ type: "string" }),
          continuesFromPreviousPage: { type: "boolean" },
          continuesOnNextPage: { type: "boolean" },
          type: { type: "string", enum: ["MCQ", "SPR"] },
          passage: nullable({ type: "string" }),
          stem: { type: "string" },
          choices: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["key", "text"],
              properties: { key: { type: "string", enum: ["A", "B", "C", "D"] }, text: { type: "string" } },
            },
          },
          answer: nullable({ type: "string" }),
          explanation: nullable({ type: "string" }),
          figures: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["box", "placement", "description"],
              properties: {
                box: { type: "array", items: { type: "number" } },
                placement: { type: "string", enum: [...PLACEMENTS] },
                description: { type: "string" },
              },
            },
          },
          suggestedDomain: nullable({ type: "string", enum: DOMAIN_KEYS }),
          suggestedSkill: nullable({ type: "string", enum: SKILL_KEYS }),
        },
      },
    },
    answerKey: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["part", "number", "answer", "explanation"],
        properties: {
          part: nullable({ type: "string" }),
          number: { type: "string" },
          answer: { type: "string" },
          explanation: nullable({ type: "string" }),
        },
      },
    },
  },
} as const;

/** Keep a figure box inside the page and in the right order; drop degenerate boxes. */
export function normalizeBox(box: readonly number[], pad = 0.01): [number, number, number, number] | null {
  if (box.length !== 4 || box.some((n) => !Number.isFinite(n))) return null;
  // Accept 0..100 percentages as well as 0..1 fractions.
  const scale = box.some((n) => n > 1.5) ? 100 : 1;
  const [a, b, c, d] = box.map((n) => n / scale) as [number, number, number, number];
  if (Math.abs(c - a) < 0.02 || Math.abs(d - b) < 0.02) return null;
  const x0 = Math.max(0, Math.min(a, c) - pad);
  const y0 = Math.max(0, Math.min(b, d) - pad);
  const x1 = Math.min(1, Math.max(a, c) + pad);
  const y1 = Math.min(1, Math.max(b, d) + pad);
  return [x0, y0, x1, y1];
}
