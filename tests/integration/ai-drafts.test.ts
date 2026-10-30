import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { makeUser, resetDb } from "./helpers";

process.env.JOBS_MODE = "inline";
const ai = vi.hoisted(() => ({
  available: true,
  drafts: [] as unknown[],
  solveAnswers: {} as Record<string, string>,
  calls: [] as { feature: string; user: string }[],
}));
vi.mock("@/server/ai/client", async (orig) => ({ ...(await orig<object>()), aiAvailable: () => ai.available, models: () => ({ fast: "f", smart: "s" }) }));
vi.mock("@/server/ai/structured", async (orig) => ({
  ...(await orig<object>()),
  generateJson: async (opts: { feature: string; user: string }) => {
    ai.calls.push({ feature: opts.feature, user: opts.user });
    if (opts.feature === "ai_draft") return { questions: ai.drafts };
    const key = Object.keys(ai.solveAnswers).find((k) => opts.user.includes(k));
    return { answer: key ? ai.solveAnswers[key] : "A", confidence: "high", ambiguous: key === "AMBIG", multipleCorrect: false, notes: "" };
  },
}));

const { requestDrafts } = await import("@/server/ai/draft-questions");
const { setQuestionStatus, updateQuestion } = await import("@/server/questions/service");
const { questionInputSchema } = await import("@/lib/questions/schema");

const mcq = (stem: string, answer: string, checkExpression: string | null) => ({
  type: "MCQ",
  passage: null,
  stem,
  choices: ["3", "4", "7", "8"].map((text, i) => ({ key: "ABCD"[i], text })),
  correctAnswers: [answer],
  explanation: "Subtract 3, then divide by 2.",
  wrongChoiceRationales: [{ key: "A", text: "Arithmetic slip." }],
  checkExpression,
});

const request = { section: "MATH", domain: "ALGEBRA", skill: "LINEAR_EQUATIONS_ONE_VARIABLE", difficulty: "MEDIUM", count: 3, codePrefix: "AI-" };

describe("AI-drafted questions", () => {
  beforeEach(async () => {
    await resetDb();
    ai.available = true;
    ai.calls = [];
    ai.solveAnswers = {};
  });

  it("drafts, checks independently and saves drafts that can't be published until a person saves them", async () => {
    const editor = await makeUser();
    ai.drafts = [
      mcq("GOOD: If $2x + 3 = 11$, what is $x$?", "B", "(11 - 3) / 2"),
      mcq("SOLVER: If $2x + 5 = 13$, what is $x$?", "B", "(13 - 5) / 2"),
      mcq("MATH: If $2x + 1 = 9$, what is $x$?", "C", "(9 - 1) / 2"),
    ];
    ai.solveAnswers = { GOOD: "B", SOLVER: "C", MATH: "C" };

    const batch = await requestDrafts(request, editor);
    const done = await db.aiDraftBatch.findUniqueOrThrow({ where: { id: batch.id } });
    expect(done.status).toBe("DONE");
    expect(done.log).toMatchObject({ mathChecks: { pass: 2, fail: 1, unchecked: 0 } });

    const qs = await db.question.findMany({ orderBy: { code: "asc" } });
    expect(qs.map((q) => q.code)).toEqual(["AI-ALG-0001", "AI-ALG-0002", "AI-ALG-0003"]);
    for (const q of qs) expect(q).toMatchObject({ origin: "AI_DRAFTED", status: "DRAFT", createdById: editor.id });
    const flagsOf = (s: string) => qs.find((q) => q.stem.startsWith(s))!.flags;
    expect(flagsOf("GOOD")).toEqual(["AI_UNREVIEWED"]);
    expect(flagsOf("SOLVER")).toEqual(expect.arrayContaining(["AI_UNREVIEWED", "AI_SOLVER_DISAGREES"]));
    expect(flagsOf("MATH")).toEqual(expect.arrayContaining(["AI_UNREVIEWED", "MATH_CHECK_FAILED"]));
    expect(ai.calls.filter((c) => c.feature === "ai_solve")).toHaveLength(3);
    // The solver never sees the key or the explanation.
    for (const c of ai.calls.filter((x) => x.feature === "ai_solve")) expect(c.user).not.toMatch(/Subtract 3|answer/i);

    const good = qs.find((q) => q.stem.startsWith("GOOD"))!;
    await expect(setQuestionStatus(good.id, "PUBLISHED", editor)).rejects.toMatchObject({ code: "BLOCKING_FLAGS" });
    const input = questionInputSchema.parse({ ...good, choices: good.choices, explanation: good.explanation, wrongChoiceRationales: good.wrongChoiceRationales });
    await updateQuestion(good.id, input, editor, { confirmTaxonomy: true });
    expect((await setQuestionStatus(good.id, "PUBLISHED", editor)).status).toBe("PUBLISHED");
  });

  it("uses our own published questions as style examples, never AI drafts or samples", async () => {
    const editor = await makeUser();
    const base = { section: "MATH" as const, domain: "ALGEBRA", skill: "LINEAR_EQUATIONS_ONE_VARIABLE", difficulty: "EASY" as const, type: "SPR" as const, correctAnswers: ["2"], tags: [], flags: [], status: "PUBLISHED" as const };
    await db.question.create({ data: { ...base, code: "OWN-1", stem: "OUR-OWN-STYLE question", origin: "MANUAL", publishedAt: new Date() } });
    await db.question.create({ data: { ...base, code: "AI-OLD-1", stem: "OLD-AI-DRAFT question", origin: "AI_DRAFTED", publishedAt: new Date() } });
    ai.drafts = [mcq("x", "B", null)];
    await requestDrafts({ ...request, count: 1, useStyle: true }, editor);
    const prompt = ai.calls.find((c) => c.feature === "ai_draft")!.user;
    expect(prompt).toContain("<example>\n<question>\nOUR-OWN-STYLE question");
    expect(prompt).not.toContain("<example>\n<question>\nOLD-AI-DRAFT");
    expect(prompt).toContain("Existing questions for this skill"); // asked to avoid duplicates
  });

  it("refuses without an API key and validates the request", async () => {
    const editor = await makeUser();
    await expect(requestDrafts({ ...request, skill: "TRANSITIONS" }, editor)).rejects.toThrow();
    ai.available = false;
    await expect(requestDrafts(request, editor)).rejects.toMatchObject({ code: "AI_UNAVAILABLE" });
  });

  it("records a failed batch", async () => {
    const editor = await makeUser();
    ai.drafts = "not an array" as never;
    const batch = await requestDrafts({ ...request, count: 1 }, editor);
    const done = await db.aiDraftBatch.findUniqueOrThrow({ where: { id: batch.id } });
    expect(done.status).toBe("FAILED");
    expect(done.error).toBeTruthy();
  });
});
