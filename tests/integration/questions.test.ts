import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  createQuestion,
  reportQuestion,
  setQuestionStatus,
  suggestNextCodes,
  updateQuestion,
  withdrawSource,
} from "@/server/questions/service";
import { makeUser, mathInput, resetDb } from "./helpers";

describe("question service", () => {
  beforeEach(resetDb);

  it("creates a question with version 1 and no flags when complete", async () => {
    const editor = await makeUser("EDITOR");
    const { question } = await createQuestion(mathInput({ code: "LC-M-ALG-0001" }), editor, { origin: "MANUAL" });
    expect(question.version).toBe(1);
    expect(question.flags).toEqual([]);
    expect(question.status).toBe("DRAFT");
    const versions = await db.questionVersion.findMany({ where: { questionId: question.id } });
    expect(versions).toHaveLength(1);
  });

  it("rejects a duplicate code", async () => {
    const editor = await makeUser("EDITOR");
    await createQuestion(mathInput({ code: "LC-M-ALG-0001" }), editor, { origin: "MANUAL" });
    await expect(createQuestion(mathInput({ code: "lc-m-alg-0001" }), editor, { origin: "MANUAL" })).rejects.toMatchObject({ code: "DUPLICATE_CODE" });
  });

  it("flags incomplete content and blocks publishing until fixed", async () => {
    const editor = await makeUser("EDITOR");
    const { question } = await createQuestion(mathInput({ correctAnswers: [] }), editor, { origin: "MANUAL" });
    expect(question.flags).toContain("MISSING_ANSWER");
    await expect(setQuestionStatus(question.id, "PUBLISHED", editor)).rejects.toMatchObject({ code: "BLOCKING_FLAGS" });

    const fixed = await updateQuestion(question.id, mathInput({ code: question.code, stem: question.stem }), editor, { expectedVersion: 1 });
    expect(fixed.question.flags).toEqual([]);
    const published = await setQuestionStatus(question.id, "PUBLISHED", editor);
    expect(published.status).toBe("PUBLISHED");
    expect(published.reviewedById).toBe(editor.id);
    expect(published.publishedAt).toBeInstanceOf(Date);
  });

  it("keeps a version for every save and detects conflicting edits", async () => {
    const editor = await makeUser("EDITOR");
    const { question } = await createQuestion(mathInput(), editor, { origin: "MANUAL" });
    await updateQuestion(question.id, mathInput({ code: question.code, explanation: "Changed." }), editor, { expectedVersion: 1 });
    await expect(updateQuestion(question.id, mathInput({ code: question.code }), editor, { expectedVersion: 1 })).rejects.toMatchObject({
      code: "VERSION_CONFLICT",
    });
    const versions = await db.questionVersion.findMany({ where: { questionId: question.id }, orderBy: { version: "asc" } });
    expect(versions.map((v) => v.version)).toEqual([1, 2]);
    expect((versions[1]!.snapshot as { explanation: string }).explanation).toBe("Changed.");
  });

  it("flags near-duplicates of existing questions", async () => {
    const editor = await makeUser("EDITOR");
    const stem = "A train travels 240 kilometers in 3 hours at a constant speed. How many kilometers does it travel in 5 hours?";
    await createQuestion(mathInput({ stem }), editor, { origin: "MANUAL" });
    const { question, nearDuplicates } = await createQuestion(mathInput({ stem: stem.replace("5 hours", "7 hours") }), editor, { origin: "MANUAL" });
    expect(nearDuplicates.length).toBe(1);
    expect(question.flags).toContain("NEAR_DUPLICATE");
  });

  it("suggests the next free code for a prefix and domain", async () => {
    const editor = await makeUser("EDITOR");
    await createQuestion(mathInput({ code: "LC-M-ALG-0007" }), editor, { origin: "MANUAL" });
    await createQuestion(mathInput({ code: "LC-M-ADV-0020", domain: "ADVANCED_MATH", skill: "EQUIVALENT_EXPRESSIONS" }), editor, { origin: "MANUAL" });
    expect(await suggestNextCodes("LC-M-", "ALGEBRA", 2)).toEqual(["LC-M-ALG-0008", "LC-M-ALG-0009"]);
    expect(await suggestNextCodes("LC-M-", "GEOMETRY_AND_TRIGONOMETRY")).toEqual(["LC-M-GEO-0001"]);
  });

  it("unpublishes everything from a withdrawn source and blocks re-publishing", async () => {
    const admin = await makeUser("ADMIN");
    const source = await db.source.create({
      data: { name: "Worksheets", owner: "Centre", rightsStatement: "ok", rightsConfirmedById: admin.id, rightsConfirmedAt: new Date() },
    });
    const a = await createQuestion(mathInput({ sourceId: source.id }), admin, { origin: "MANUAL", status: "PUBLISHED" });
    await createQuestion(mathInput({ sourceId: source.id }), admin, { origin: "MANUAL" });
    const other = await createQuestion(mathInput(), admin, { origin: "MANUAL", status: "PUBLISHED" });

    expect(await withdrawSource(source.id, admin)).toBe(2);
    expect((await db.question.findUniqueOrThrow({ where: { id: a.question.id } })).status).toBe("RETIRED");
    expect((await db.question.findUniqueOrThrow({ where: { id: other.question.id } })).status).toBe("PUBLISHED");
    expect((await db.source.findUniqueOrThrow({ where: { id: source.id } })).withdrawnAt).toBeInstanceOf(Date);
    await expect(setQuestionStatus(a.question.id, "PUBLISHED", admin)).rejects.toMatchObject({ code: "SOURCE_WITHDRAWN" });
    expect(await db.auditLog.count({ where: { action: "source.withdraw" } })).toBe(1);
  });

  it("sends a reported question back to review, once per student", async () => {
    const admin = await makeUser("ADMIN");
    const student = await makeUser();
    const { question } = await createQuestion(mathInput(), admin, { origin: "MANUAL", status: "PUBLISHED" });
    await reportQuestion(question.id, student.id, "WRONG_ANSWER", "B is wrong");
    expect(await reportQuestion(question.id, student.id, "TYPO", null)).toEqual({ alreadyReported: true });
    const q = await db.question.findUniqueOrThrow({ where: { id: question.id } });
    expect(q.status).toBe("IN_REVIEW");
    expect(q.flags).toContain("STUDENT_REPORT");
    expect(q.reportCount).toBe(1);

    // Re-approving resolves the report and clears the flag.
    const again = await setQuestionStatus(question.id, "PUBLISHED", admin);
    expect(again.flags).not.toContain("STUDENT_REPORT");
    expect(await db.questionReport.count({ where: { questionId: question.id, status: "OPEN" } })).toBe(0);
  });
});
