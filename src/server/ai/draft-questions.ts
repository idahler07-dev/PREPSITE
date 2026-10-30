import "server-only";
import { z } from "zod";
import en from "../../../messages/en.json";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { aiLimits } from "@/config/ai-limits";
import { draftResponseJsonSchema, draftResponseSchema, solveJsonSchema, solveSchema, type DraftQuestion } from "@/lib/ai/draft-schema";
import { mathCheck } from "@/lib/ai/math-check";
import { normalizePrefix, PREFIX_PATTERN } from "@/lib/questions/codes";
import type { Flag } from "@/lib/questions/flags";
import { gradeAnswer } from "@/lib/questions/grading";
import { questionInputSchema } from "@/lib/questions/schema";
import { getDomain, isValidSkill } from "@/lib/taxonomy";
import { HttpError } from "@/server/http";
import { enqueue, JOBS } from "@/server/jobs/queue";
import { createQuestion, suggestNextCodes } from "@/server/questions/service";
import { aiAvailable, models } from "./client";
import { AiCallError, generateJson } from "./structured";

const skillNames = en.taxonomy.skills as Record<string, string>;
const domainNames = en.taxonomy.domains as Record<string, string>;

export const draftRequestSchema = z
  .object({
    section: z.enum(["RW", "MATH"]),
    domain: z.string().max(60),
    skill: z.string().max(60),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
    count: z.coerce.number().int().min(1).max(aiLimits.draftBatchMax),
    useStyle: z.boolean().default(false),
    codePrefix: z.string().transform(normalizePrefix).pipe(z.string().regex(PREFIX_PATTERN)),
  })
  .refine((r) => getDomain(r.domain)?.section === r.section && isValidSkill(r.domain, r.skill), { message: "INVALID_TAXONOMY" });

export async function requestDrafts(raw: unknown, actor: { id: string }) {
  if (!aiAvailable()) throw new HttpError(503, "AI_UNAVAILABLE");
  const input = draftRequestSchema.parse(raw);
  const batch = await db.aiDraftBatch.create({ data: { ...input, createdById: actor.id } });
  await enqueue(JOBS.aiDraft, { batchId: batch.id });
  return batch;
}

const DRAFT_SYSTEM = `You write original practice questions for a digital SAT preparation website run by a learning centre.

Rules:
- Every question must be your own original work. Do not copy, paraphrase or closely imitate questions, passages or explanations from the College Board, Bluebook, Khan Academy, other test-prep companies or any published book. Write new passages; do not quote copyrighted texts. Facts about the real world must be accurate; when unsure, use clearly invented names and data.
- Follow the digital SAT format for the requested section and skill. Reading and Writing: one short passage (25–150 words, or two short texts labelled "Text 1" and "Text 2" for cross-text questions) and one question with four choices A–D. Math: multiple choice (four choices A–D) or student-produced response (the student types a number: at most 5 characters for a positive answer, 6 for a negative one; fractions like 3/4 or decimals).
- Exactly one choice is correct. Each wrong choice is plausible but wrong for a specific reason (a typical mistake).
- Match the requested difficulty as on the real test.
- Write math in LaTeX between $...$; write a dollar sign as \\$. No images or figures: every question must be answerable from its text (Markdown tables are allowed).
- correctAnswers: for multiple choice, the single correct letter; for student-produced response, every accepted form (e.g. "3/4" and ".75").
- explanation: a clear step-by-step solution that ends at the answer. wrongChoiceRationales: one sentence for each wrong choice (empty for student-produced response).
- checkExpression (Math only): an arithmetic expression using numbers, + - * / ^ ( ), sqrt and pi that evaluates to the correct answer, so a calculator can verify it. Use null when the answer is not a single number, and always null for Reading and Writing.
- Vary contexts, names and numbers. Do not reuse the style examples or the existing questions you are shown.`;

const SOLVE_SYSTEM = `You are checking a draft SAT practice question. Solve it yourself, carefully, without being told the intended answer.
Return the answer as a single choice letter (A–D) for multiple choice, or the number for a typed answer.
Set ambiguous to true if the wording is unclear or information is missing; set multipleCorrect to true if more than one choice could reasonably be defended. Use notes for one or two sentences on any problem you see (otherwise an empty string).`;

function questionText(q: { passage: string | null; stem: string; type: "MCQ" | "SPR"; choices: { key: string; text: string }[] }) {
  return [
    q.passage ? `<passage>\n${q.passage}\n</passage>` : "",
    `<question>\n${q.stem}\n</question>`,
    q.type === "MCQ" ? `<choices>\n${q.choices.map((c) => `${c.key}) ${c.text}`).join("\n")}\n</choices>` : "Type: student-produced response (enter a number).",
  ]
    .filter(Boolean)
    .join("\n");
}

async function styleExamples(skill: string): Promise<string[]> {
  const rows = await db.question.findMany({
    where: { skill, status: "PUBLISHED", origin: { not: "AI_DRAFTED" }, isSample: false },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: { passage: true, stem: true, type: true, choices: true, correctAnswers: true, explanation: true },
  });
  return rows.map((r) =>
    [questionText({ ...r, choices: (r.choices as { key: string; text: string }[] | null) ?? [] }), `Answer: ${r.correctAnswers.join(", ")}`, r.explanation ? `Explanation: ${r.explanation}` : ""]
      .filter(Boolean)
      .join("\n"),
  );
}

/** Job: draft, solve independently, check the math, then save as drafts for review. */
export async function runDraftBatch(batchId: string) {
  const claimed = await db.aiDraftBatch.updateMany({ where: { id: batchId, status: "QUEUED" }, data: { status: "RUNNING" } });
  if (claimed.count === 0) return;
  const batch = await db.aiDraftBatch.findUniqueOrThrow({ where: { id: batchId } });
  const actor = { id: batch.createdById };
  const smart = models().smart;
  const log: { created: { id: string; code: string; flags: string[] }[]; skipped: { reason: string }[]; mathChecks: Record<string, number> } = {
    created: [],
    skipped: [],
    mathChecks: { pass: 0, fail: 0, unchecked: 0 },
  };

  try {
    const existing = await db.question.findMany({ where: { skill: batch.skill }, orderBy: { createdAt: "desc" }, take: 40, select: { stem: true, passage: true } });
    const examples = batch.useStyle ? await styleExamples(batch.skill) : [];
    const user = [
      `Section: ${batch.section === "MATH" ? "Math" : "Reading and Writing"}`,
      `Domain: ${domainNames[batch.domain] ?? batch.domain}`,
      `Skill: ${skillNames[batch.skill] ?? batch.skill}`,
      `Difficulty: ${batch.difficulty.toLowerCase()}`,
      `Number of questions: ${batch.count}`,
      examples.length
        ? `Style examples — our centre's own questions. Match their tone, length and level; do not reuse their content:\n${examples.map((e) => `<example>\n${e}\n</example>`).join("\n")}`
        : "",
      existing.length ? `Existing questions for this skill (write different ones):\n${existing.map((q) => `- ${(q.passage ?? q.stem).slice(0, 120).replace(/\s+/g, " ")}`).join("\n")}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const drafted = await generateJson({
      model: smart,
      system: DRAFT_SYSTEM,
      user,
      jsonSchema: draftResponseJsonSchema,
      schema: draftResponseSchema,
      maxTokens: 32_000,
      feature: "ai_draft",
      userId: batch.createdById,
      refId: batch.id,
    });

    const drafts = drafted.questions.slice(0, batch.count);
    const codes = await suggestNextCodes(batch.codePrefix, batch.domain, drafts.length);
    for (const [i, d] of drafts.entries()) {
      const result = await saveDraft(d, codes[i]!, batch, actor, smart, log.mathChecks);
      if ("reason" in result) log.skipped.push(result);
      else log.created.push(result);
    }
    await db.aiDraftBatch.update({
      where: { id: batch.id },
      data: { status: "DONE", finishedAt: new Date(), log: log as unknown as Prisma.InputJsonValue },
    });
  } catch (e) {
    const message = e instanceof AiCallError || e instanceof Error ? e.message : String(e);
    await db.aiDraftBatch.update({
      where: { id: batch.id },
      data: { status: "FAILED", finishedAt: new Date(), error: message.slice(0, 500), log: log as unknown as Prisma.InputJsonValue },
    });
  }
}

async function saveDraft(
  d: DraftQuestion,
  code: string,
  batch: { id: string; section: "RW" | "MATH"; domain: string; skill: string; difficulty: "EASY" | "MEDIUM" | "HARD"; createdById: string },
  actor: { id: string },
  model: string,
  mathChecks: Record<string, number>,
): Promise<{ id: string; code: string; flags: string[] } | { reason: string }> {
  // Reading and Writing is always multiple choice.
  if (batch.section === "RW" && d.type !== "MCQ") return { reason: "RW question was not multiple choice" };
  const parsed = questionInputSchema.safeParse({
    code,
    section: batch.section,
    domain: batch.domain,
    skill: batch.skill,
    difficulty: batch.difficulty,
    type: d.type,
    passage: d.passage,
    stem: d.stem,
    choices: d.type === "MCQ" ? d.choices : null,
    correctAnswers: d.correctAnswers,
    explanation: d.explanation,
    wrongChoiceRationales: d.type === "MCQ" ? Object.fromEntries(d.wrongChoiceRationales.map((r) => [r.key, r.text])) : null,
    tags: ["ai-draft"],
  });
  if (!parsed.success) return { reason: `invalid draft: ${parsed.error.issues[0]?.message ?? "unknown"}` };
  const input = parsed.data;

  const flags: Flag[] = ["AI_UNREVIEWED"];
  // Independent solve without the key.
  try {
    const solved = await generateJson({
      model,
      system: SOLVE_SYSTEM,
      user: questionText({ passage: input.passage ?? null, stem: input.stem, type: input.type, choices: input.choices ?? [] }),
      jsonSchema: solveJsonSchema,
      schema: solveSchema,
      maxTokens: 16_000,
      feature: "ai_solve",
      userId: batch.createdById,
      refId: batch.id,
    });
    if (!gradeAnswer({ type: input.type, correctAnswers: input.correctAnswers }, solved.answer)) flags.push("AI_SOLVER_DISAGREES");
    if (solved.ambiguous || solved.multipleCorrect) flags.push("AI_AMBIGUOUS");
  } catch {
    // A failed check must not pass silently: treat it as a disagreement for the reviewer.
    flags.push("AI_SOLVER_DISAGREES");
  }
  if (batch.section === "MATH") {
    const check = mathCheck({ type: input.type, choices: input.choices, correctAnswers: input.correctAnswers, checkExpression: d.checkExpression });
    mathChecks[check] = (mathChecks[check] ?? 0) + 1;
    if (check === "fail") flags.push("MATH_CHECK_FAILED");
  }

  const { question } = await createQuestion(input, actor, { origin: "AI_DRAFTED", status: "DRAFT", extraFlags: flags });
  return { id: question.id, code: question.code, flags: question.flags };
}
