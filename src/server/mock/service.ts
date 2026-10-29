import "server-only";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { testStructure } from "@/config/test-structure";
import { assembleMock, type MockCandidate } from "@/lib/mock/assemble";
import { estimateScores, routeModuleTwo } from "@/lib/mock/scoring";
import type { SectionKey } from "@/lib/taxonomy";
import { HttpError } from "@/server/http";
import { assertTestAllowance } from "@/server/billing/entitlement";

const SECTIONS: SectionKey[] = ["RW", "MATH"];

function moduleSpec(section: SectionKey, moduleNumber: 1 | 2) {
  const spec = testStructure.sections.find((s) => s.section === section)?.modules.find((m) => m.moduleNumber === moduleNumber);
  if (!spec) throw new Error(`No module ${section} ${moduleNumber} in test-structure`);
  return spec;
}

const moduleSize = Object.fromEntries(SECTIONS.map((s) => [s, moduleSpec(s, 1).questionCount])) as Record<SectionKey, number>;

async function candidates(sections: SectionKey[]): Promise<MockCandidate[]> {
  const rows = await db.question.findMany({
    where: { status: "PUBLISHED", section: { in: sections } },
    select: { id: true, section: true, domain: true, difficulty: true },
  });
  return rows;
}

async function seenBy(userId: string): Promise<Set<string>> {
  const rows = await db.response.findMany({
    where: { module: { attempt: { userId } } },
    select: { questionId: true },
    distinct: ["questionId"],
  });
  return new Set(rows.map((r) => r.questionId));
}

export const buildMockSchema = z.object({
  title: z.string().trim().min(1).max(120),
  sections: z.array(z.enum(["RW", "MATH"])).min(1).max(2),
});

/** Assemble and store a test. Staff tests are saved as drafts even with gaps (publishing is blocked until fixed). */
export async function buildMockTest(
  raw: unknown,
  opts: { kind: "CURATED"; createdById: string } | { kind: "GENERATED"; forUserId: string },
) {
  const input = buildMockSchema.parse(raw);
  const sections = SECTIONS.filter((s) => input.sections.includes(s));
  const seed = randomInt(2 ** 31);
  const seen = opts.kind === "GENERATED" ? await seenBy(opts.forUserId) : undefined;
  const result = assembleMock(await candidates(sections), { sections, moduleSize, seed, seen });
  if (opts.kind === "GENERATED" && result.missing > 0) throw new HttpError(422, "NOT_ENOUGH_QUESTIONS", String(result.missing));

  return db.mockTest.create({
    data: {
      title: input.title,
      kind: opts.kind,
      status: opts.kind === "GENERATED" ? "PUBLISHED" : "DRAFT",
      sections,
      seed,
      assemblyLog: { shortfalls: result.shortfalls, missing: result.missing } as unknown as Prisma.InputJsonValue,
      createdById: opts.kind === "CURATED" ? opts.createdById : null,
      forUserId: opts.kind === "GENERATED" ? opts.forUserId : null,
      publishedAt: opts.kind === "GENERATED" ? new Date() : null,
      modules: { create: result.modules.map((m) => ({ section: m.section, moduleNumber: m.moduleNumber, variant: m.variant, questionIds: m.questionIds })) },
    },
    select: { id: true },
  });
}

export function mockMissing(log: unknown): number {
  return (log as { missing?: number } | null)?.missing ?? 0;
}

export async function setMockStatus(id: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  const mock = await db.mockTest.findUnique({ where: { id }, select: { kind: true, assemblyLog: true } });
  if (!mock || mock.kind !== "CURATED") throw new HttpError(404, "NOT_FOUND");
  if (status === "PUBLISHED" && mockMissing(mock.assemblyLog) > 0) throw new HttpError(422, "MOCK_INCOMPLETE");
  return db.mockTest.update({ where: { id }, data: { status, publishedAt: status === "PUBLISHED" ? new Date() : undefined } });
}

/** What a student can start: full test, one section (both modules, adaptive) or module 1 of one section. */
export const startMockSchema = z.object({
  mockTestId: z.string().max(40),
  scope: z.enum(["full", "RW", "MATH", "module-RW", "module-MATH"]),
});

export async function startMock(userId: string, raw: unknown) {
  const { mockTestId, scope } = startMockSchema.parse(raw);
  const mock = await db.mockTest.findUnique({ where: { id: mockTestId }, include: { modules: true } });
  const visible = mock && mock.status === "PUBLISHED" && (mock.kind === "CURATED" || mock.forUserId === userId);
  if (!mock || !visible) throw new HttpError(404, "NOT_FOUND");

  await assertTestAllowance(userId);
  const sections: SectionKey[] = scope === "full" ? SECTIONS.filter((s) => mock.sections.includes(s)) : [scope.replace("module-", "") as SectionKey];
  if (!sections.every((s) => mock.sections.includes(s))) throw new HttpError(422, "SECTION_NOT_IN_TEST");
  const moduleOnly = scope.startsWith("module-");

  const modules: Prisma.AttemptModuleCreateWithoutAttemptInput[] = [];
  for (const section of sections) {
    const first = mock.modules.find((m) => m.section === section && m.moduleNumber === 1);
    if (!first) throw new HttpError(422, "SECTION_NOT_IN_TEST");
    modules.push({
      index: modules.length,
      section,
      moduleNumber: 1,
      variant: "standard",
      timeLimitSec: moduleSpec(section, 1).timeLimitSec,
      responses: { create: first.questionIds.map((questionId, position) => ({ questionId, position })) },
    });
    // Module 2 gets its questions when module 1 is submitted (adaptive).
    if (!moduleOnly) modules.push({ index: modules.length, section, moduleNumber: 2, timeLimitSec: moduleSpec(section, 2).timeLimitSec });
  }

  return db.attempt.create({
    data: {
      userId,
      kind: scope === "full" ? "MOCK" : moduleOnly ? "MODULE" : "SECTION",
      mockTestId,
      config: { scope, mockTitle: mock.title } as Prisma.InputJsonValue,
      feedbackMode: "END",
      timed: true,
      modules: { create: modules },
    },
    select: { id: true },
  });
}

/**
 * Called after a module of a mock attempt is graded: fills the adaptive
 * module 2 of the same section and starts the break before the next section.
 */
export async function afterMockModule(attemptId: string, moduleIndex: number) {
  const attempt = await db.attempt.findUniqueOrThrow({
    where: { id: attemptId },
    include: { mockTest: { include: { modules: true } }, modules: { orderBy: { index: "asc" }, include: { responses: { select: { isCorrect: true } } } } },
  });
  if (!attempt.mockTest) return;
  const done = attempt.modules.find((m) => m.index === moduleIndex)!;
  const next = attempt.modules.find((m) => m.index === moduleIndex + 1);
  if (!next) return;

  if (next.section === done.section && next.moduleNumber === 2 && next.responses.length === 0) {
    const correct = done.responses.filter((r) => r.isCorrect).length;
    const variant = routeModuleTwo(correct, done.responses.length);
    const source = attempt.mockTest.modules.find((m) => m.section === done.section && m.moduleNumber === 2 && m.variant === variant);
    if (!source) throw new Error("Mock test is missing a module-2 variant");
    // Only one caller gets to fill it (the variant column is the claim).
    const claimed = await db.attemptModule.updateMany({ where: { id: next.id, variant: null }, data: { variant } });
    if (claimed.count === 1) {
      await db.response.createMany({ data: source.questionIds.map((questionId, position) => ({ moduleId: next.id, questionId, position })) });
    }
  } else if (next.section !== done.section) {
    await db.attempt.update({ where: { id: attemptId }, data: { breakEndsAt: new Date(Date.now() + testStructure.breakSec * 1000) } });
  }
}

/** Estimated scores for a completed mock or section attempt (null for single modules and drills). */
export async function scoreAttempt(attemptId: string) {
  const attempt = await db.attempt.findUniqueOrThrow({
    where: { id: attemptId },
    include: { modules: { include: { responses: { select: { isCorrect: true } } } } },
  });
  if (attempt.kind !== "MOCK" && attempt.kind !== "SECTION") return null;
  const bySection = new Map<SectionKey, { route: "easier" | "harder"; correct: number; total: number }>();
  for (const m of attempt.modules) {
    if (!m.section) continue;
    const s = bySection.get(m.section) ?? { route: "easier" as const, correct: 0, total: 0 };
    if (m.moduleNumber === 2 && (m.variant === "harder" || m.variant === "easier")) s.route = m.variant;
    s.correct += m.responses.filter((r) => r.isCorrect).length;
    s.total += m.responses.length;
    bySection.set(m.section, s);
  }
  const estimate = estimateScores(SECTIONS.filter((s) => bySection.has(s)).map((section) => ({ section, ...bySection.get(section)! })));
  await db.attempt.update({ where: { id: attemptId }, data: { scores: estimate as unknown as Prisma.InputJsonValue } });
  // The coach updates the plan after every scored test (never blocks the result).
  const { generatePlan } = await import("@/server/coach/service");
  await generatePlan(attempt.userId, "after-test", { withMessage: true }).catch((e) => console.warn("[coach]", e));
  return estimate;
}
