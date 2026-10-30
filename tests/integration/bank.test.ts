import { beforeEach, describe, expect, it } from "vitest";
import { createQuestion } from "@/server/questions/service";
import { checkResponse, createDrill, getRunnerState, saveResponses, type RunnerState } from "@/server/attempts/service";
import { bankFiltersSchema, getBankPage, getBankPracticeIds, getDifficultyCounts, getDomainProgress, stemPreview } from "@/server/bank/query";
import { makeUser, mathInput, resetDb } from "./helpers";

async function seed() {
  const author = await makeUser();
  const make = (difficulty: "EASY" | "MEDIUM" | "HARD", stem: string) => createQuestion(mathInput({ difficulty, stem }), author, { origin: "MANUAL", status: "PUBLISHED" });
  const easy = await make("EASY", "Easy one: what is $1+1$?");
  const medium = await make("MEDIUM", "Medium one about lines");
  const hard = await make("HARD", "Hard one about circles");
  await createQuestion(mathInput({ stem: "DRAFT never shown" }), author, { origin: "MANUAL" });
  return { easy: easy.question, medium: medium.question, hard: hard.question };
}

const f = (raw: Record<string, string>) => bankFiltersSchema.parse({ section: "MATH", ...raw });

describe("question bank", () => {
  beforeEach(resetDb);

  it("lists published questions easy to hard with the student's own status", async () => {
    const q = await seed();
    const student = await makeUser();
    // Answer the medium question wrongly (choice A; the key is B in mathInput).
    const drill = await createDrill(student.id, { questionIds: [q.medium.id], count: 1, feedback: "IMMEDIATE" });
    const state = (await getRunnerState(drill.id, student.id)) as RunnerState;
    await saveResponses(drill.id, student.id, { moduleId: state.module.id, updates: [{ position: 0, answer: "A", flagged: true }] });
    await checkResponse(drill.id, student.id, state.module.id, 0);

    const page = await getBankPage(student.id, f({}));
    expect(page.total).toBe(3);
    expect(page.rows.map((r) => r.difficulty)).toEqual(["EASY", "MEDIUM", "HARD"]);
    const medium = page.rows.find((r) => r.id === q.medium.id)!;
    expect(medium.status).toBe("incorrect");
    expect(medium.flagged).toBe(true);
    expect(page.rows.find((r) => r.id === q.easy.id)!.status).toBe("unattempted");

    expect((await getBankPage(student.id, f({ status: "incorrect" }))).rows.map((r) => r.id)).toEqual([q.medium.id]);
    expect((await getBankPage(student.id, f({ status: "unattempted" }))).total).toBe(2);
    expect((await getBankPage(student.id, f({ status: "flagged" }))).total).toBe(1);
    expect((await getBankPage(student.id, f({ q: "circles" }))).rows.map((r) => r.id)).toEqual([q.hard.id]);
    expect(await getDifficultyCounts(student.id, f({ difficulty: "HARD" }))).toEqual({ EASY: 1, MEDIUM: 1, HARD: 1 });
    expect(await getBankPracticeIds(student.id, f({}), "mistakes")).toEqual([q.medium.id]);

    const progress = await getDomainProgress(student.id, "MATH");
    const algebra = progress.find((p) => p.domain === "ALGEBRA")!;
    expect(algebra).toMatchObject({ total: 3, attempted: 1, correct: 0 });

    // Another student's answers never show up.
    const other = await makeUser();
    expect((await getBankPage(other.id, f({ status: "incorrect" }))).total).toBe(0);
  });

  it("ignores filters that don't fit and keeps drills to published questions", async () => {
    const q = await seed();
    expect(f({ section: "RW", domain: "ALGEBRA" }).domain).toBeUndefined();
    expect(f({ sort: "nonsense", page: "-3" })).toMatchObject({ sort: "difficulty", page: 1 });
    const student = await makeUser();
    const drill = await createDrill(student.id, { questionIds: [q.hard.id, q.easy.id], count: 2, returnTo: "/question-bank?section=MATH" });
    const state = (await getRunnerState(drill.id, student.id)) as RunnerState;
    expect(state.items.map((i) => i.questionId)).toEqual([q.hard.id, q.easy.id]);
    expect(state.returnTo).toBe("/question-bank?section=MATH");
    await expect(createDrill(student.id, { questionIds: [q.easy.id], returnTo: "https://evil.example" })).rejects.toThrow();
  });

  it("previews stems as plain text", () => {
    expect(stemPreview("If $\\frac{1}{2}x = 3$, what is **x**?")).toBe("If 1/2x = 3, what is x?");
    expect(stemPreview("A plan costs \\$12 plus \\$0.05 per text, so $c = 12 + 0.05t$.")).toBe("A plan costs $12 plus $0.05 per text, so c = 12 + 0.05t.");
  });
});
