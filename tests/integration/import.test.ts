import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { analyzeRows, commitBatch, readSpreadsheet } from "@/server/import/spreadsheet";
import { newStorageKey, sha256, storage } from "@/server/storage";
import { createQuestion } from "@/server/questions/service";
import { makeUser, mathInput, resetDb } from "./helpers";

const HEADER = "code,section,domain,skill,difficulty,type,passage,stem,choice_a,choice_b,choice_c,choice_d,correct_answer,explanation,image_url";
const CSV = [
  HEADER,
  "LC-M-ALG-0001,MATH,Algebra,Linear functions,easy,MCQ,,What is $2+2$?,3,4,5,6,B,Add.,",
  ",MATH,ALG,LINEAR_FUNCTIONS,hard,MCQ,,What is $3+3$?,5,6,7,8,b,,",
  ",math,Advanced Math,Equivalent expressions,,SPR,,What is $\\frac{1}{2}$ as a decimal?,,,,,.5;1/2,,",
  ",MATH,Algebra,Linear functions,easy,MCQ,,No answer row,1,2,3,4,,,",
  ",MATH,Made Up Domain,,easy,MCQ,,Bad row,1,2,3,4,A,,",
  "LC-M-ALG-0001,MATH,Algebra,Linear functions,easy,MCQ,,Reused code in the same file,1,2,3,4,A,,",
].join("\n");

async function pendingBatch(csv: string, actorId: string) {
  const bytes = new TextEncoder().encode(csv);
  const key = newStorageKey("sources", ".csv");
  await storage().put(key, bytes, "text/csv");
  const source = await db.source.create({
    data: { name: "Test", owner: "Centre", rightsStatement: "ok", rightsConfirmedById: actorId, rightsConfirmedAt: new Date() },
  });
  const file = await db.sourceFile.create({
    data: { sourceId: source.id, kind: "SPREADSHEET", storageKey: key, originalName: "q.csv", mimeType: "text/csv", sizeBytes: bytes.length, sha256: sha256(bytes), uploadedById: actorId },
  });
  return db.importBatch.create({
    data: { kind: "SPREADSHEET", sourceId: source.id, fileId: file.id, defaultDifficulty: "MEDIUM", codePrefix: "LC-M-", rightsConfirmedById: actorId, rightsConfirmedAt: new Date(), createdById: actorId },
  });
}

describe("spreadsheet import", () => {
  beforeEach(resetDb);

  it("checks every row, assigns unique codes and reports errors", async () => {
    const { rows } = await readSpreadsheet(new TextEncoder().encode(CSV), "csv");
    const results = await analyzeRows(rows, { section: null, difficulty: "MEDIUM", codePrefix: "LC-M-" });
    expect(results.map((r) => r.code ?? null)).toEqual(["LC-M-ALG-0001", "LC-M-ALG-0002", "LC-M-ADV-0001", "LC-M-ALG-0003", null, "LC-M-ALG-0004"]);
    expect(results[1]!.row!.correctAnswers).toEqual(["B"]);
    expect(results[2]!.row!.difficulty).toBe("MEDIUM");
    expect(results[2]!.warnings).toContain("DIFFICULTY_DEFAULTED");
    expect(results[3]!.flags).toContain("MISSING_ANSWER");
    expect(results[4]!.errors).toContain("INVALID_DOMAIN");
    expect(results[5]!.warnings).toContain("CODE_REASSIGNED");
    expect(results[5]!.flags).toContain("DUPLICATE_CODE");
  });

  it("reassigns codes already used in the bank", async () => {
    const editor = await makeUser();
    await createQuestion(mathInput({ code: "LC-M-ALG-0001" }), editor, { origin: "MANUAL" });
    const { rows } = await readSpreadsheet(new TextEncoder().encode([HEADER, CSV.split("\n")[1]].join("\n")), "csv");
    const [r] = await analyzeRows(rows, { section: null, difficulty: "MEDIUM", codePrefix: "LC-M-" });
    expect(r!.code).toBe("LC-M-ALG-0002");
    expect(r!.flags).toContain("DUPLICATE_CODE");
  });

  it("creates drafts with provenance and refuses to import twice", async () => {
    const editor = await makeUser();
    const batch = await pendingBatch(CSV, editor.id);
    expect(await commitBatch(batch.id, editor)).toEqual({ created: 5 });
    const questions = await db.question.findMany({ where: { importBatchId: batch.id }, orderBy: { code: "asc" } });
    expect(questions).toHaveLength(5);
    expect(questions.every((q) => q.status === "DRAFT" && q.origin === "IMPORTED" && q.sourceFileId === batch.fileId && q.importedById === editor.id)).toBe(true);
    expect(questions.map((q) => q.sourceRef).sort()).toEqual(["2", "3", "4", "5", "7"]);
    expect(await db.questionVersion.count()).toBe(5);
    expect((await db.importBatch.findUniqueOrThrow({ where: { id: batch.id } })).status).toBe("READY");
    await expect(commitBatch(batch.id, editor)).rejects.toMatchObject({ code: "ALREADY_IMPORTED" });
  });

  it("refuses to import into a withdrawn source", async () => {
    const editor = await makeUser();
    const batch = await pendingBatch(CSV, editor.id);
    await db.source.update({ where: { id: batch.sourceId }, data: { withdrawnAt: new Date() } });
    await expect(commitBatch(batch.id, editor)).rejects.toMatchObject({ code: "SOURCE_WITHDRAWN" });
  });
});
