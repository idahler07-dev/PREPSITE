import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createQuestion } from "@/server/questions/service";
import { checkResponse, createDrill, getResults, getRunnerState, saveResponses, submitModule, type RunnerState } from "@/server/attempts/service";
import { makeUser, mathInput, resetDb } from "./helpers";

async function bank(count: number) {
  const admin = await makeUser("ADMIN");
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const { question } = await createQuestion(mathInput({ explanation: `SECRET-EXPLANATION-${i}` }), admin, { origin: "MANUAL", status: "PUBLISHED" });
    ids.push(question.id);
  }
  // A draft that must never reach students.
  await createQuestion(mathInput({ stem: "DRAFT ONLY question" }), admin, { origin: "MANUAL" });
  return ids;
}

async function state(attemptId: string, userId: string) {
  const s = await getRunnerState(attemptId, userId);
  if ("completed" in s) throw new Error("attempt already completed");
  return s as RunnerState;
}

describe("drills and the test engine", () => {
  beforeEach(resetDb);

  it("builds drills from published questions only, unseen first", async () => {
    await bank(6);
    const student = await makeUser();
    const first = await createDrill(student.id, { count: 4, section: "MATH" });
    const s1 = await state(first.id, student.id);
    expect(s1.items).toHaveLength(4);
    expect(s1.items.some((i) => i.stemHtml.includes("DRAFT ONLY"))).toBe(false);

    const second = await createDrill(student.id, { count: 2 });
    const s2 = await state(second.id, student.id);
    const firstIds = new Set(s1.items.map((i) => i.questionId));
    expect(s2.items.every((i) => !firstIds.has(i.questionId))).toBe(true);
  });

  it("refuses an impossible drill", async () => {
    const student = await makeUser();
    await expect(createDrill(student.id, { section: "RW" })).rejects.toMatchObject({ code: "NO_QUESTIONS" });
  });

  it("never sends answers or explanations before they are earned", async () => {
    await bank(3);
    const student = await makeUser();
    const { id } = await createDrill(student.id, { count: 3, feedback: "END" });
    const s = await state(id, student.id);
    const json = JSON.stringify(s);
    expect(json).not.toContain("SECRET-EXPLANATION");
    expect(json).not.toContain("correctAnswers");
    expect(s.items.every((i) => i.feedback === null)).toBe(true);
  });

  it("only lets the owner see or change an attempt", async () => {
    await bank(2);
    const owner = await makeUser();
    const other = await makeUser();
    const { id } = await createDrill(owner.id, { count: 2 });
    const s = await state(id, owner.id);
    await expect(getRunnerState(id, other.id)).rejects.toMatchObject({ status: 404 });
    await expect(saveResponses(id, other.id, { moduleId: s.module.id, updates: [{ position: 0, answer: "A" }] })).rejects.toMatchObject({ status: 404 });
    await expect(submitModule(id, other.id, s.module.id)).rejects.toMatchObject({ status: 404 });
  });

  it("saves answers, flags, cross-outs and time, and validates them", async () => {
    await bank(2);
    const student = await makeUser();
    const { id } = await createDrill(student.id, { count: 2 });
    const s = await state(id, student.id);
    await saveResponses(id, student.id, {
      moduleId: s.module.id,
      updates: [{ position: 0, answer: "b", flagged: true, eliminated: ["A", "C"], timeDeltaMs: 4000 }],
    });
    await saveResponses(id, student.id, { moduleId: s.module.id, updates: [{ position: 0, timeDeltaMs: 1500 }] });
    const after = await state(id, student.id);
    expect(after.items[0]).toMatchObject({ answer: "B", flagged: true, eliminated: ["A", "C"], timeSpentMs: 5500 });
    await expect(saveResponses(id, student.id, { moduleId: s.module.id, updates: [{ position: 1, answer: "Z" }] })).rejects.toMatchObject({
      code: "INVALID_ANSWER",
    });
  });

  it("immediate feedback reveals one answer and locks it", async () => {
    await bank(2);
    const student = await makeUser();
    const { id } = await createDrill(student.id, { count: 2, feedback: "IMMEDIATE" });
    const s = await state(id, student.id);
    await saveResponses(id, student.id, { moduleId: s.module.id, updates: [{ position: 0, answer: "B" }] });
    const fb = await checkResponse(id, student.id, s.module.id, 0);
    expect(fb.isCorrect).toBe(true);
    expect(fb.correctAnswers).toEqual(["B"]);
    expect(fb.explanationHtml).toContain("SECRET-EXPLANATION");

    // The checked answer can no longer change; the unchecked one still hides its key.
    await saveResponses(id, student.id, { moduleId: s.module.id, updates: [{ position: 0, answer: "A" }] });
    const after = await state(id, student.id);
    expect(after.items[0]!.answer).toBe("B");
    expect(after.items[0]!.feedback?.isCorrect).toBe(true);
    expect(after.items[1]!.feedback).toBeNull();
  });

  it("does not allow checking answers in end-of-test mode", async () => {
    await bank(1);
    const student = await makeUser();
    const { id } = await createDrill(student.id, { count: 1, feedback: "END" });
    const s = await state(id, student.id);
    await saveResponses(id, student.id, { moduleId: s.module.id, updates: [{ position: 0, answer: "B" }] });
    await expect(checkResponse(id, student.id, s.module.id, 0)).rejects.toMatchObject({ code: "NOT_ALLOWED" });
  });

  it("grades on submit, completes the attempt once, and updates question stats", async () => {
    const ids = await bank(3);
    const student = await makeUser();
    const { id } = await createDrill(student.id, { count: 3, feedback: "END" });
    const s = await state(id, student.id);
    await saveResponses(id, student.id, {
      moduleId: s.module.id,
      updates: [
        { position: 0, answer: "B" },
        { position: 1, answer: "A" },
      ],
    });
    expect(await submitModule(id, student.id, s.module.id)).toEqual({ completed: true });
    expect(await submitModule(id, student.id, s.module.id)).toEqual({ completed: true });

    const attempt = await db.attempt.findUniqueOrThrow({ where: { id } });
    expect(attempt).toMatchObject({ status: "COMPLETED", correctCount: 1, totalCount: 3 });
    const results = await getResults(id, student.id);
    expect(results!.items.map((i) => i.isCorrect)).toEqual([true, false, false]);
    expect(results!.items[0]!.feedback.explanationHtml).toContain("SECRET-EXPLANATION");

    const stats = await db.question.findMany({ where: { id: { in: ids } }, select: { attemptCount: true, correctCount: true } });
    expect(stats.reduce((a, q) => a + q.attemptCount, 0)).toBe(2); // unanswered questions don't count
    expect(stats.reduce((a, q) => a + q.correctCount, 0)).toBe(1);

    await expect(saveResponses(id, student.id, { moduleId: s.module.id, updates: [{ position: 2, answer: "A" }] })).rejects.toMatchObject({
      code: "MODULE_CLOSED",
    });
  });

  it("enforces the time limit on the server and auto-submits", async () => {
    await bank(2);
    const student = await makeUser();
    const { id } = await createDrill(student.id, { count: 2, timed: true, feedback: "END" });
    const s = await state(id, student.id);
    expect(s.module.deadline).not.toBeNull();
    // Pretend the module started long ago.
    await db.attemptModule.update({ where: { id: s.module.id }, data: { startedAt: new Date(Date.now() - 3 * 3600_000) } });
    await expect(saveResponses(id, student.id, { moduleId: s.module.id, updates: [{ position: 0, answer: "B" }] })).rejects.toMatchObject({
      code: "TIME_UP",
    });
    expect(await getRunnerState(id, student.id)).toEqual({ completed: true });
    expect((await db.attempt.findUniqueOrThrow({ where: { id } })).status).toBe("COMPLETED");
  });
});
