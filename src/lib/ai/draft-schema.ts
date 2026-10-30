import { z } from "zod";

/** What the drafting model returns for each question (validated before anything is saved). */
export const draftQuestionSchema = z.object({
  type: z.enum(["MCQ", "SPR"]),
  passage: z.string().max(4000).nullable(),
  stem: z.string().min(1).max(2000),
  choices: z.array(z.object({ key: z.enum(["A", "B", "C", "D"]), text: z.string().min(1).max(600) })).max(4),
  correctAnswers: z.array(z.string().min(1).max(12)).min(1).max(6),
  explanation: z.string().min(1).max(4000),
  wrongChoiceRationales: z.array(z.object({ key: z.enum(["A", "B", "C", "D"]), text: z.string().max(600) })).max(4),
  checkExpression: z.string().max(200).nullable(),
});
export const draftResponseSchema = z.object({ questions: z.array(draftQuestionSchema).max(30) });
export type DraftQuestion = z.infer<typeof draftQuestionSchema>;

const nullable = (schema: object) => ({ anyOf: [schema, { type: "null" }] });
const keyed = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    required: ["key", "text"],
    properties: { key: { type: "string", enum: ["A", "B", "C", "D"] }, text: { type: "string" } },
  },
};

export const draftResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "passage", "stem", "choices", "correctAnswers", "explanation", "wrongChoiceRationales", "checkExpression"],
        properties: {
          type: { type: "string", enum: ["MCQ", "SPR"] },
          passage: nullable({ type: "string" }),
          stem: { type: "string" },
          choices: keyed,
          correctAnswers: { type: "array", items: { type: "string" } },
          explanation: { type: "string" },
          wrongChoiceRationales: keyed,
          checkExpression: nullable({ type: "string" }),
        },
      },
    },
  },
} as const;

/** The independent solver's answer (it never sees the key). */
export const solveSchema = z.object({
  answer: z.string().max(40),
  confidence: z.enum(["high", "medium", "low"]),
  ambiguous: z.boolean(),
  multipleCorrect: z.boolean(),
  notes: z.string().max(1000),
});
export type SolveResult = z.infer<typeof solveSchema>;

export const solveJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["answer", "confidence", "ambiguous", "multipleCorrect", "notes"],
  properties: {
    answer: { type: "string" },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    ambiguous: { type: "boolean" },
    multipleCorrect: { type: "boolean" },
    notes: { type: "string" },
  },
} as const;
