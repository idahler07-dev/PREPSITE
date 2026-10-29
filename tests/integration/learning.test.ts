import { readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { makeUser, resetDb } from "./helpers";

process.env.EMAIL_TRANSPORT = "outbox";
const { createDrill, getRunnerState, saveResponses, checkResponse, submitModule } = await import("@/server/attempts/service");
const { startReview, startDailyQuestion, saveQuestionNote, notebookCounts } = await import("@/server/review/service");
const { gradeWord, vocabSession } = await import("@/server/vocab/service");
const { generatePlan, currentPlan } = await import("@/server/coach/service");
const { sendEveningReminders } = await import("@/server/notify/jobs");

async function bank(n: number) {
  await db.question.createMany({
    data: Array.from({ length: n }, (_, i) => ({
      code: `L-${i}`,
      section: "MATH" as const,
      domain: "ALGEBRA",
      skill: "LINEAR_FUNCTIONS",
      difficulty: "EASY" as const,
      type: "MCQ" as const,
      stem: `Q${i}`,
      choices: ["A", "B", "C", "D"].map((key) => ({ key, text: key })),
      correctAnswers: ["B"],
      tags: [],
      flags: [],
      origin: "MANUAL" as const,
      status: "PUBLISHED" as const,
    })),
  });
}

async function drill(userId: string, answers: string[], feedback: "IMMEDIATE" | "END" = "IMMEDIATE") {
  const a = await createDrill(userId, { count: answers.length, feedback });
  const s = await getRunnerState(a.id, userId);
  if (!("items" in s)) throw new Error("no module");
  await saveResponses(a.id, userId, { moduleId: s.module.id, updates: s.items.map((it, i) => ({ position: it.position, answer: answers[i], flagged: i === 0 })) });
  if (feedback === "IMMEDIATE") for (const it of s.items) await checkResponse(a.id, userId, s.module.id, it.position);
  await submitModule(a.id, userId, s.module.id);
  return s.items.map((i) => i.questionId);
}

describe("mistake notebook (SM-2)", () => {
  beforeEach(resetDb);

  it("adds wrong answers, then reschedules them in review sessions", async () => {
    await bank(6);
    const user = await makeUser();
    const qids = await drill(user.id, ["A", "B", "C"]);
    const items = await db.reviewItem.findMany({ where: { userId: user.id } });
    expect(items.map((i) => i.questionId).sort()).toEqual([qids[0], qids[2]].sort());
    expect(await notebookCounts(user.id)).toMatchObject({ due: 0, total: 2 }); // due tomorrow
    await expect(startReview(user.id, {})).rejects.toMatchObject({ code: "NOTHING_DUE" });

    await db.reviewItem.updateMany({ data: { dueAt: new Date(Date.now() - 1000) } });
    const r = await startReview(user.id, { count: 10 });
    const s = await getRunnerState(r.id, user.id);
    if (!("items" in s)) throw new Error();
    expect(s.items).toHaveLength(2);
    await saveResponses(r.id, user.id, { moduleId: s.module.id, updates: s.items.map((it) => ({ position: it.position, answer: "B" })) });
    for (const it of s.items) await checkResponse(r.id, user.id, s.module.id, it.position);
    const after = await db.reviewItem.findMany({ where: { userId: user.id } });
    for (const i of after) expect(i).toMatchObject({ repetitions: 1, intervalDays: 1 });
  });

  it("gives the same daily question all day and saves notes only for seen questions", async () => {
    await bank(6);
    const user = await makeUser();
    const a = await startDailyQuestion(user.id);
    const b = await startDailyQuestion(user.id);
    expect(b.id).toBe(a.id);
    const q = await db.response.findFirstOrThrow({ where: { module: { attemptId: a.id } } });
    const other = await db.question.findFirstOrThrow({ where: { id: { not: q.questionId } } });
    await saveQuestionNote(user.id, { questionId: q.questionId, bookmarked: true, note: " tricky " });
    expect(await db.questionNote.findFirstOrThrow()).toMatchObject({ bookmarked: true, note: "tricky" });
    await expect(saveQuestionNote(user.id, { questionId: other.id, bookmarked: true })).rejects.toMatchObject({ status: 404 });
    const fromBookmarks = await startReview(user.id, { source: "bookmarks" });
    expect(await db.attempt.findUniqueOrThrow({ where: { id: fromBookmarks.id } })).toMatchObject({ kind: "DRILL" });
  });
});

describe("vocabulary and coach", () => {
  beforeEach(resetDb);

  it("introduces new words and schedules them", async () => {
    const user = await makeUser();
    await db.vocabWord.createMany({ data: ["alpha", "beta", "gamma"].map((word) => ({ word, partOfSpeech: "noun", definition: "d", example: `An ${word} example.` })) });
    const first = await vocabSession(user.id);
    expect(first.map((w) => w.word)).toEqual(["alpha", "beta", "gamma"]);
    expect(first.every((w) => w.isNew)).toBe(true);
    await gradeWord(user.id, { wordId: first[0]!.id, grade: "good" });
    await gradeWord(user.id, { wordId: first[1]!.id, grade: "again" });
    const next = await vocabSession(user.id, new Date(Date.now() + 2 * 86_400_000));
    expect(next.filter((w) => !w.isNew).map((w) => w.word).sort()).toEqual(["alpha", "beta"]);
  });

  it("builds this week's plan from practice and the test date", async () => {
    await bank(6);
    const user = await makeUser();
    await db.user.update({ where: { id: user.id }, data: { testDate: new Date(Date.now() + 40 * 86_400_000) } });
    await drill(user.id, ["A", "A", "A", "B"]);
    const row = await generatePlan(user.id, "test");
    const plan = row.plan as { minutesPerDay: number; focusSkills: string[]; days: unknown[] };
    expect(plan.minutesPerDay).toBe(45);
    expect(plan.focusSkills[0]).toBe("LINEAR_FUNCTIONS");
    expect(plan.days).toHaveLength(7);
    expect((await currentPlan(user.id)).id).toBe(row.id);
  });
});

describe("notifications", () => {
  const OUTBOX = path.join(process.cwd(), ".data", "dev-mail");
  const mails = (email: string) => {
    try {
      return readdirSync(OUTBOX).filter((f) => f.endsWith(`-${email.replace(/[^a-z0-9@._-]/gi, "_")}.json`)).length;
    } catch {
      return 0;
    }
  };
  beforeEach(async () => {
    await resetDb();
    rmSync(OUTBOX, { recursive: true, force: true });
  });

  it("sends evening streak reminders once, only to those who allow them", async () => {
    const DAY = 86_400_000;
    const now = new Date("2026-11-05T14:00:00Z"); // 19:00 in Tashkent
    const keen = await makeUser();
    const quiet = await makeUser();
    await db.user.update({ where: { id: quiet.id }, data: { notificationPrefs: { email: { streak: false, study: false } } } });
    for (const u of [keen, quiet])
      for (const d of [1, 2]) await db.attempt.create({ data: { userId: u.id, kind: "DRILL", config: {}, startedAt: new Date(now.getTime() - d * DAY) } });
    expect(await sendEveningReminders(now)).toBe(1);
    expect(await sendEveningReminders(now)).toBe(0);
    expect(mails(keen.email!)).toBe(1);
    expect(mails(quiet.email!)).toBe(0);
  });
});
