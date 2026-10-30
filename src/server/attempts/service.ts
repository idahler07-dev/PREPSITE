import "server-only";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { secondsPerQuestion } from "@/config/test-structure";
import { drillConfigSchema, seededRandom, selectDrillQuestions, type DrillConfig } from "@/lib/practice/drill";
import { gradeAnswer } from "@/lib/questions/grading";
import { renderMarkdown } from "@/lib/markdown/render";
import { SPR_ALLOWED_CHARS } from "@/lib/questions/spr";
import { HttpError } from "@/server/http";
import { afterMockModule, scoreAttempt } from "@/server/mock/service";
import { assertQuestionAllowance } from "@/server/billing/entitlement";
import { recordOutcomes } from "@/server/review/service";

/** Answers saved this long after the deadline are still accepted (network delays). */
export const DEADLINE_GRACE_MS = 30_000;

// ─── Building drills ─────────────────────────────────────────────────────────

export function drillWhere(c: DrillConfig): Prisma.QuestionWhereInput {
  const and: Prisma.QuestionWhereInput[] = [{ status: "PUBLISHED" }];
  if (c.section) and.push({ section: c.section });
  if (c.domains.length) and.push({ domain: { in: c.domains } });
  if (c.skills.length) and.push({ skill: { in: c.skills } });
  if (c.difficulties.length) and.push({ difficulty: { in: c.difficulties } });
  if (c.codeFrom) and.push({ code: { gte: c.codeFrom } });
  if (c.codeTo) and.push({ code: { lte: c.codeTo } });
  return { AND: and };
}

export async function countDrillMatches(raw: unknown) {
  const c = drillConfigSchema.parse(raw);
  return db.question.count({ where: drillWhere(c) });
}

export async function createDrill(userId: string, raw: unknown, kind: "DRILL" | "DAILY" | "REVIEW" = "DRILL") {
  const config = drillConfigSchema.parse(raw);
  const candidates = await db.question.findMany({
    where: drillWhere(config),
    select: { id: true, section: true },
    take: 5000,
  });
  if (candidates.length === 0) throw new HttpError(422, "NO_QUESTIONS");

  const seenRows = await db.response.findMany({
    where: { questionId: { in: candidates.map((c) => c.id) }, module: { attempt: { userId } } },
    select: { questionId: true },
    distinct: ["questionId"],
  });
  await assertQuestionAllowance(userId, Math.min(config.count, candidates.length));
  const seed = randomInt(2 ** 31);
  const picked = selectDrillQuestions(candidates, new Set(seenRows.map((r) => r.questionId)), config.count, {
    unseenFirst: config.unseenFirst,
    rand: seededRandom(seed),
  });
  const sections = new Set(picked.map((p) => p.section));
  const section = sections.size === 1 ? [...sections][0]! : null;
  const timeLimitSec = config.timed ? Math.round(picked.length * secondsPerQuestion(section ?? "MIXED")) : null;

  return db.attempt.create({
    data: {
      userId,
      kind,
      config: { ...config, seed } as Prisma.InputJsonValue,
      feedbackMode: config.feedback,
      timed: config.timed,
      modules: {
        create: {
          index: 0,
          section,
          timeLimitSec,
          startedAt: new Date(),
          responses: { create: picked.map((q, position) => ({ questionId: q.id, position })) },
        },
      },
    },
    select: { id: true },
  });
}

// ─── Loading an attempt for the test screen ─────────────────────────────────

const responseQuestionSelect = {
  id: true,
  code: true,
  section: true,
  domain: true,
  skill: true,
  difficulty: true,
  type: true,
  passage: true,
  stem: true,
  choices: true,
  correctAnswers: true,
  explanation: true,
  wrongChoiceRationales: true,
} as const;

type Choices = { key: string; text: string }[];

async function loadOwnedAttempt(attemptId: string, userId: string) {
  const attempt = await db.attempt.findUnique({
    where: { id: attemptId },
    include: {
      modules: {
        orderBy: { index: "asc" },
        include: { responses: { orderBy: { position: "asc" }, include: { question: { select: responseQuestionSelect } } } },
      },
    },
  });
  // Not found and not yours look the same, so attempt ids can't be probed.
  if (!attempt || attempt.userId !== userId) throw new HttpError(404, "NOT_FOUND");
  return attempt;
}

type LoadedAttempt = Awaited<ReturnType<typeof loadOwnedAttempt>>;
type LoadedModule = LoadedAttempt["modules"][number];
type LoadedResponse = LoadedModule["responses"][number];

export function moduleDeadline(m: { startedAt: Date | null; timeLimitSec: number | null }): Date | null {
  if (!m.startedAt || !m.timeLimitSec) return null;
  return new Date(m.startedAt.getTime() + m.timeLimitSec * 1000);
}

function isExpired(m: LoadedModule, now = Date.now()) {
  const deadline = moduleDeadline(m);
  return !!deadline && now > deadline.getTime() + DEADLINE_GRACE_MS;
}

/** Feedback for one answered question: correct answer and explanation. Only after checking or submitting. */
export function feedbackFor(r: LoadedResponse) {
  const q = r.question;
  const rationales = (q.wrongChoiceRationales as Record<string, string> | null) ?? {};
  const chosen = r.answer?.toUpperCase();
  return {
    isCorrect: r.isCorrect ?? false,
    correctAnswers: q.correctAnswers,
    explanationHtml: renderMarkdown(q.explanation),
    rationaleHtml: q.type === "MCQ" && chosen && rationales[chosen] && !r.isCorrect ? renderMarkdown(rationales[chosen]) : "",
  };
}

export interface RunnerItem {
  position: number;
  questionId: string;
  section: "RW" | "MATH";
  /** Skill and difficulty, shown on practice screens only (never in practice tests). Question codes are never sent here. */
  meta: { domain: string; skill: string; difficulty: "EASY" | "MEDIUM" | "HARD" } | null;
  type: "MCQ" | "SPR";
  passageHtml: string;
  stemHtml: string;
  choices: { key: string; html: string }[];
  answer: string | null;
  flagged: boolean;
  eliminated: string[];
  timeSpentMs: number;
  feedback: ReturnType<typeof feedbackFor> | null;
}

export interface BreakState {
  id: string;
  onBreak: true;
  breakEndsAt: string;
  serverNow: string;
  nextSection: "RW" | "MATH" | null;
}

export interface RunnerState {
  id: string;
  kind: string;
  status: string;
  feedbackMode: "IMMEDIATE" | "END";
  timed: boolean;
  serverNow: string;
  module: {
    id: string;
    index: number;
    count: number;
    section: "RW" | "MATH" | null;
    moduleNumber: number | null;
    timeLimitSec: number | null;
    deadline: string | null;
    /** Position among the attempt's modules for this section/test, e.g. "Module 2 of 4". */
    ordinal: number;
  };
  items: RunnerItem[];
  /** Saved Desmos state, if any (see saveCalculatorState). */
  calculatorState: unknown;
}

/**
 * Everything the test screen needs. Correct answers and explanations are
 * included only for questions already checked (drills with immediate feedback).
 */
export async function getRunnerState(attemptId: string, userId: string): Promise<RunnerState | BreakState | { completed: true }> {
  let attempt = await loadOwnedAttempt(attemptId, userId);
  if (attempt.status !== "IN_PROGRESS") return { completed: true };

  if (attempt.breakEndsAt) {
    if (attempt.breakEndsAt.getTime() > Date.now()) {
      const upcoming = attempt.modules.find((m) => !m.submittedAt);
      return { id: attempt.id, onBreak: true, breakEndsAt: attempt.breakEndsAt.toISOString(), serverNow: new Date().toISOString(), nextSection: upcoming?.section ?? null };
    }
    await db.attempt.update({ where: { id: attemptId }, data: { breakEndsAt: null } });
  }

  let current = attempt.modules.find((m) => !m.submittedAt);
  if (current && isExpired(current)) {
    await submitModule(attemptId, userId, current.id);
    attempt = await loadOwnedAttempt(attemptId, userId);
    if (attempt.status !== "IN_PROGRESS") return { completed: true };
    current = attempt.modules.find((m) => !m.submittedAt);
  }
  if (!current) return { completed: true };
  if (!current.startedAt) {
    current = { ...current, startedAt: new Date() };
    await db.attemptModule.update({ where: { id: current.id }, data: { startedAt: current.startedAt } });
  }

  const deadline = moduleDeadline(current);
  return {
    calculatorState: attempt.calculatorState ?? null,
    id: attempt.id,
    kind: attempt.kind,
    status: attempt.status,
    feedbackMode: attempt.feedbackMode,
    timed: attempt.timed,
    serverNow: new Date().toISOString(),
    module: {
      id: current.id,
      index: current.index,
      count: attempt.modules.length,
      section: current.section,
      moduleNumber: current.moduleNumber,
      timeLimitSec: current.timeLimitSec,
      deadline: deadline?.toISOString() ?? null,
      ordinal: current.index + 1,
    },
    items: current.responses.map((r) => ({
      position: r.position,
      questionId: r.questionId,
      section: r.question.section,
      meta: attempt.kind === "MOCK" ? null : { domain: r.question.domain, skill: r.question.skill, difficulty: r.question.difficulty },
      type: r.question.type,
      passageHtml: renderMarkdown(r.question.passage),
      stemHtml: renderMarkdown(r.question.stem),
      choices: r.question.type === "MCQ" ? ((r.question.choices as Choices | null) ?? []).map((c) => ({ key: c.key, html: renderMarkdown(c.text) })) : [],
      answer: r.answer,
      flagged: r.flagged,
      eliminated: r.eliminated,
      timeSpentMs: r.timeSpentMs,
      feedback: attempt.feedbackMode === "IMMEDIATE" && r.gradedAt ? feedbackFor(r) : null,
    })),
  };
}

// ─── Saving answers ──────────────────────────────────────────────────────────

export const responseUpdateSchema = z.object({
  moduleId: z.string().max(40),
  updates: z
    .array(
      z.object({
        position: z.number().int().min(0).max(200),
        answer: z.string().max(10).nullable().optional(),
        flagged: z.boolean().optional(),
        eliminated: z.array(z.enum(["A", "B", "C", "D"])).max(4).optional(),
        /** Time spent on this question since the last save (capped per save). */
        timeDeltaMs: z.number().int().min(0).max(10 * 60_000).optional(),
      }),
    )
    .max(100),
});

async function requireOpenModule(attemptId: string, userId: string, moduleId: string) {
  const m = await db.attemptModule.findUnique({
    where: { id: moduleId },
    select: { id: true, attemptId: true, submittedAt: true, startedAt: true, timeLimitSec: true, attempt: { select: { userId: true, status: true, feedbackMode: true, kind: true } } },
  });
  if (!m || m.attemptId !== attemptId || m.attempt.userId !== userId) throw new HttpError(404, "NOT_FOUND");
  if (m.attempt.status !== "IN_PROGRESS" || m.submittedAt) throw new HttpError(409, "MODULE_CLOSED");
  const deadline = moduleDeadline(m);
  if (deadline && Date.now() > deadline.getTime() + DEADLINE_GRACE_MS) throw new HttpError(409, "TIME_UP");
  return m;
}

export async function saveResponses(attemptId: string, userId: string, raw: unknown) {
  const { moduleId, updates } = responseUpdateSchema.parse(raw);
  const m = await requireOpenModule(attemptId, userId, moduleId);
  const responses = await db.response.findMany({
    where: { moduleId, position: { in: updates.map((u) => u.position) } },
    include: { question: { select: { type: true, choices: true } } },
  });
  const byPos = new Map(responses.map((r) => [r.position, r]));

  await db.$transaction(
    updates.flatMap((u) => {
      const r = byPos.get(u.position);
      if (!r) return [];
      const data: Prisma.ResponseUpdateInput = {};
      // After an answer is checked (immediate feedback) it can't be changed.
      const locked = m.attempt.feedbackMode === "IMMEDIATE" && !!r.gradedAt;
      if (u.answer !== undefined && !locked) {
        const answer = u.answer === null || u.answer.trim() === "" ? null : u.answer.trim();
        if (answer !== null) {
          if (r.question.type === "MCQ" && !["A", "B", "C", "D"].includes(answer.toUpperCase())) throw new HttpError(400, "INVALID_ANSWER");
          // Invalid SPR entries (e.g. "3 1/2") are stored as typed and graded wrong.
          if (r.question.type === "SPR" && (!SPR_ALLOWED_CHARS.test(answer) || answer.length > 8)) throw new HttpError(400, "INVALID_ANSWER");
        }
        data.answer = answer && r.question.type === "MCQ" ? answer.toUpperCase() : answer;
        data.answeredAt = answer ? new Date() : null;
      }
      if (u.flagged !== undefined) data.flagged = u.flagged;
      if (u.eliminated !== undefined) data.eliminated = [...new Set(u.eliminated)];
      if (u.timeDeltaMs) data.timeSpentMs = { increment: u.timeDeltaMs };
      return Object.keys(data).length ? [db.response.update({ where: { id: r.id }, data })] : [];
    }),
  );
  return { ok: true };
}

// ─── Checking and submitting ─────────────────────────────────────────────────

async function recordQuestionStats(results: { questionId: string; isCorrect: boolean }[]) {
  for (const r of results) {
    await db.question.update({
      where: { id: r.questionId },
      data: { attemptCount: { increment: 1 }, correctCount: { increment: r.isCorrect ? 1 : 0 } },
    });
  }
}

/** Immediate-feedback drills: grade one question and reveal its answer. */
export async function checkResponse(attemptId: string, userId: string, moduleId: string, position: number) {
  const m = await requireOpenModule(attemptId, userId, moduleId);
  if (m.attempt.feedbackMode !== "IMMEDIATE") throw new HttpError(403, "NOT_ALLOWED");
  const r = await db.response.findUnique({
    where: { moduleId_position: { moduleId, position } },
    include: { question: { select: responseQuestionSelect } },
  });
  if (!r) throw new HttpError(404, "NOT_FOUND");
  if (!r.answer) throw new HttpError(400, "NO_ANSWER");
  if (r.gradedAt) return feedbackFor(r);

  const isCorrect = gradeAnswer(r.question, r.answer);
  const updated = await db.response.update({
    where: { id: r.id },
    data: { isCorrect, gradedAt: new Date() },
    include: { question: { select: responseQuestionSelect } },
  });
  await recordQuestionStats([{ questionId: r.questionId, isCorrect }]);
  await recordOutcomes(userId, m.attempt.kind, [{ questionId: r.questionId, isCorrect, flagged: r.flagged, answered: true }]);
  return feedbackFor(updated);
}

/** Grade a module; when it is the last one, complete the attempt. Safe to call twice. */
export async function submitModule(attemptId: string, userId: string, moduleId: string) {
  const attempt = await loadOwnedAttempt(attemptId, userId);
  const m = attempt.modules.find((x) => x.id === moduleId);
  if (!m) throw new HttpError(404, "NOT_FOUND");
  if (m.submittedAt) return { completed: attempt.status === "COMPLETED" };

  const now = new Date();
  // Claim the module first so two concurrent submits can't both grade it.
  const claimed = await db.attemptModule.updateMany({ where: { id: m.id, submittedAt: null }, data: { submittedAt: now } });
  if (claimed.count === 0) return { completed: attempt.status === "COMPLETED" };

  const newlyGraded: { questionId: string; isCorrect: boolean }[] = [];
  await db.$transaction(
    m.responses
      .filter((r) => !r.gradedAt)
      .map((r) => {
        const isCorrect = gradeAnswer(r.question, r.answer);
        if (r.answer) newlyGraded.push({ questionId: r.questionId, isCorrect });
        return db.response.update({ where: { id: r.id }, data: { isCorrect, gradedAt: now } });
      }),
  );
  await recordQuestionStats(newlyGraded);
  // Checked-as-you-go questions were recorded when checked; the rest are recorded now.
  await recordOutcomes(
    userId,
    attempt.kind,
    m.responses.filter((r) => !r.gradedAt).map((r) => ({ questionId: r.questionId, isCorrect: gradeAnswer(r.question, r.answer), flagged: r.flagged, answered: !!r.answer })),
  );
  if (attempt.mockTestId) await afterMockModule(attemptId, m.index);

  const isLast = attempt.modules.every((x) => x.id === m.id || x.submittedAt);
  if (isLast) {
    const totals = await db.response.groupBy({
      by: ["isCorrect"],
      where: { module: { attemptId } },
      _count: true,
    });
    const correct = totals.find((t) => t.isCorrect === true)?._count ?? 0;
    const total = totals.reduce((s, t) => s + t._count, 0);
    await db.attempt.update({
      where: { id: attemptId },
      data: { status: "COMPLETED", completedAt: now, correctCount: correct, totalCount: total, currentModule: m.index, breakEndsAt: null },
    });
    await scoreAttempt(attemptId);
    return { completed: true };
  }
  const next = attempt.modules.find((x) => !x.submittedAt && x.id !== m.id);
  await db.attempt.update({ where: { id: attemptId }, data: { currentModule: next?.index ?? m.index } });
  return { completed: false };
}

/** Leave the break between sections early. */
export async function endBreak(attemptId: string, userId: string) {
  const a = await db.attempt.findUnique({ where: { id: attemptId }, select: { userId: true } });
  if (!a || a.userId !== userId) throw new HttpError(404, "NOT_FOUND");
  await db.attempt.update({ where: { id: attemptId }, data: { breakEndsAt: null } });
}

// ─── Results ─────────────────────────────────────────────────────────────────

export async function getResults(attemptId: string, userId: string) {
  const attempt = await loadOwnedAttempt(attemptId, userId);
  if (attempt.status !== "COMPLETED") return null;
  const items = attempt.modules.flatMap((m) =>
    m.responses.map((r) => ({
      moduleIndex: m.index,
      position: r.position,
      questionId: r.questionId,
      section: r.question.section,
      domain: r.question.domain,
      skill: r.question.skill,
      difficulty: r.question.difficulty,
      type: r.question.type,
      answer: r.answer,
      isCorrect: r.isCorrect ?? false,
      flagged: r.flagged,
      timeSpentMs: r.timeSpentMs,
      passageHtml: renderMarkdown(r.question.passage),
      stemHtml: renderMarkdown(r.question.stem),
      choices: r.question.type === "MCQ" ? ((r.question.choices as Choices | null) ?? []).map((c) => ({ key: c.key, html: renderMarkdown(c.text) })) : [],
      feedback: feedbackFor(r),
    })),
  );
  return {
    id: attempt.id,
    kind: attempt.kind,
    startedAt: attempt.startedAt,
    completedAt: attempt.completedAt,
    correct: attempt.correctCount ?? items.filter((i) => i.isCorrect).length,
    total: attempt.totalCount ?? items.length,
    config: attempt.config as Record<string, unknown>,
    scores: attempt.scores as import("@/lib/mock/scoring").ScoreEstimate | null,
    modules: attempt.modules.map((m) => ({ index: m.index, section: m.section, moduleNumber: m.moduleNumber, variant: m.variant })),
    items,
  };
}

// ─── Calculator state ────────────────────────────────────────────────────────

/** Largest Desmos state we keep per attempt (graphs with many expressions stay well under this). */
const CALC_STATE_MAX_BYTES = 200_000;

/** Save the Desmos calculator state with an attempt in progress. */
export async function saveCalculatorState(attemptId: string, userId: string, state: unknown) {
  const size = JSON.stringify(state ?? null).length;
  if (size > CALC_STATE_MAX_BYTES) throw new HttpError(413, "TOO_LARGE");
  if (state === null || typeof state !== "object" || Array.isArray(state)) throw new HttpError(400, "VALIDATION");
  const attempt = await db.attempt.findUnique({ where: { id: attemptId }, select: { userId: true, status: true } });
  if (!attempt || attempt.userId !== userId) throw new HttpError(404, "NOT_FOUND");
  if (attempt.status !== "IN_PROGRESS") throw new HttpError(409, "NOT_IN_PROGRESS");
  await db.attempt.update({ where: { id: attemptId }, data: { calculatorState: state as object } });
  return { ok: true };
}
