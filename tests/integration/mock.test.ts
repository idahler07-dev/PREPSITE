import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { sectionBlueprints } from "@/config/mock-blueprint";
import { buildMockTest, setMockStatus, startMock } from "@/server/mock/service";
import { endBreak, getRunnerState, saveResponses, submitModule, getResults } from "@/server/attempts/service";
import { loadAnnotations, saveAnnotation } from "@/server/attempts/annotations";
import { makeUser, resetDb } from "./helpers";

/** `per` published questions for every domain × difficulty of both sections; answer is always B. */
async function seedBank(per: number) {
  const data = [];
  let n = 0;
  for (const section of ["RW", "MATH"] as const)
    for (const domain of Object.keys(sectionBlueprints[section].domainCounts))
      for (const difficulty of ["EASY", "MEDIUM", "HARD"] as const)
        for (let i = 0; i < per; i++)
          data.push({
            code: `MK-${section}-${String(++n).padStart(4, "0")}`,
            section,
            domain,
            skill: "X",
            difficulty,
            type: "MCQ" as const,
            stem: `Q${n}`,
            choices: ["A", "B", "C", "D"].map((key) => ({ key, text: key })),
            correctAnswers: ["B"],
            tags: [],
            origin: "MANUAL" as const,
            flags: [],
            status: "PUBLISHED" as const,
          });
  await db.question.createMany({ data });
}

async function answerModule(attemptId: string, userId: string, correctShare: number) {
  const state = await getRunnerState(attemptId, userId);
  if ("completed" in state || "onBreak" in state) throw new Error("not in a module");
  const n = state.items.length;
  const right = Math.round(n * correctShare);
  await saveResponses(attemptId, userId, {
    moduleId: state.module.id,
    updates: state.items.map((it, i) => ({ position: it.position, answer: i < right ? "B" : "A" })),
  });
  return submitModule(attemptId, userId, state.module.id);
}

describe("full adaptive mock tests", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("builds, publishes, routes module 2, takes a break and scores", async () => {
    await seedBank(10);
    const admin = await makeUser();
    const mock = await buildMockTest({ title: "Practice Test 1", sections: ["RW", "MATH"] }, { kind: "CURATED", createdById: admin.id });
    await expect(startMock(admin.id, { mockTestId: mock.id, scope: "full" })).rejects.toMatchObject({ status: 404 }); // still a draft
    await setMockStatus(mock.id, "PUBLISHED");

    const student = await makeUser();
    const attempt = await startMock(student.id, { mockTestId: mock.id, scope: "full" });

    // RW module 1: 80% → harder module 2.
    expect(await answerModule(attempt.id, student.id, 0.8)).toEqual({ completed: false });
    const rw2 = await db.attemptModule.findFirstOrThrow({ where: { attemptId: attempt.id, index: 1 }, include: { _count: { select: { responses: true } } } });
    expect(rw2).toMatchObject({ variant: "harder", moduleNumber: 2 });
    expect(rw2._count.responses).toBe(27);

    // RW module 2, then the break before Math.
    await answerModule(attempt.id, student.id, 0.5);
    const onBreak = await getRunnerState(attempt.id, student.id);
    expect(onBreak).toMatchObject({ onBreak: true, nextSection: "MATH" });
    await endBreak(attempt.id, student.id);

    // Math module 1: 30% → easier module 2.
    await answerModule(attempt.id, student.id, 0.3);
    const m2 = await db.attemptModule.findFirstOrThrow({ where: { attemptId: attempt.id, index: 3 } });
    expect(m2.variant).toBe("easier");
    expect(await answerModule(attempt.id, student.id, 0.5)).toEqual({ completed: true });

    const results = await getResults(attempt.id, student.id);
    expect(results!.scores!.sections.map((s) => `${s.section}:${s.route}`)).toEqual(["RW:harder", "MATH:easier"]);
    expect(results!.scores!.total!.score).toBe(results!.scores!.sections[0]!.score + results!.scores!.sections[1]!.score);
    expect(results!.items).toHaveLength(27 * 2 + 22 * 2);
  });

  it("runs single sections and single modules, and generated tests avoid seen questions", async () => {
    await seedBank(10);
    const student = await makeUser();
    const gen = await buildMockTest({ title: "My test", sections: ["MATH"] }, { kind: "GENERATED", forUserId: student.id });
    const other = await makeUser();
    await expect(startMock(other.id, { mockTestId: gen.id, scope: "MATH" })).rejects.toMatchObject({ status: 404 });

    const mod = await startMock(student.id, { mockTestId: gen.id, scope: "module-MATH" });
    expect(await answerModule(mod.id, student.id, 1)).toEqual({ completed: true });
    expect((await db.attempt.findUniqueOrThrow({ where: { id: mod.id } })).scores).toBeNull(); // one module: no scaled score

    const seen = new Set((await db.response.findMany({ where: { module: { attemptId: mod.id } } })).map((r) => r.questionId));
    const next = await buildMockTest({ title: "Again", sections: ["MATH"] }, { kind: "GENERATED", forUserId: student.id });
    const m1 = await db.mockModule.findFirstOrThrow({ where: { mockTestId: next.id, moduleNumber: 1 } });
    expect(m1.questionIds.filter((id) => seen.has(id))).toHaveLength(0);
  });

  it("refuses to generate or publish a test the bank can't fill", async () => {
    await seedBank(1);
    const admin = await makeUser();
    const student = await makeUser();
    await expect(buildMockTest({ title: "x", sections: ["MATH"] }, { kind: "GENERATED", forUserId: student.id })).rejects.toMatchObject({ code: "NOT_ENOUGH_QUESTIONS" });
    const draft = await buildMockTest({ title: "x", sections: ["MATH"] }, { kind: "CURATED", createdById: admin.id });
    await expect(setMockStatus(draft.id, "PUBLISHED")).rejects.toMatchObject({ code: "MOCK_INCOMPLETE" });
  });

  it("saves highlights and notes only for questions in your own attempt", async () => {
    await seedBank(10);
    const admin = await makeUser();
    const mock = await buildMockTest({ title: "T", sections: ["RW"] }, { kind: "CURATED", createdById: admin.id });
    await setMockStatus(mock.id, "PUBLISHED");
    const student = await makeUser();
    const attempt = await startMock(student.id, { mockTestId: mock.id, scope: "RW" });
    const state = await getRunnerState(attempt.id, student.id);
    if (!("items" in state)) throw new Error("expected a module");
    const qid = state.items[0]!.questionId;

    await saveAnnotation(attempt.id, student.id, { questionId: qid, highlights: [{ start: 0, end: 4, color: "yellow" }], note: " remember " });
    expect(await loadAnnotations(attempt.id, student.id)).toEqual({ [qid]: { highlights: [{ start: 0, end: 4, color: "yellow" }], note: "remember" } });

    const intruder = await makeUser();
    await expect(saveAnnotation(attempt.id, intruder.id, { questionId: qid, highlights: [], note: null })).rejects.toMatchObject({ status: 404 });
    await expect(saveAnnotation(attempt.id, student.id, { questionId: qid, highlights: [{ start: 5, end: 2, color: "yellow" }], note: null })).rejects.toThrow();
    expect(await loadAnnotations(attempt.id, intruder.id)).toEqual({});
  });
});
