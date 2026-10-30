import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { db } from "@/lib/db";
import { newStorageKey, storage } from "@/server/storage";
import { makeUser, resetDb } from "./helpers";

// Jobs run immediately in tests; the AI reader is replaced per test.
process.env.JOBS_MODE = "inline";
const aiMock = vi.hoisted(() => ({ available: false, extract: null as null | ((input: { pageNumber: number; role: string }) => unknown) }));
vi.mock("@/server/ai/client", async (orig) => ({ ...(await orig<object>()), aiAvailable: () => aiMock.available }));
vi.mock("@/server/ai/extract-page", async (orig) => ({
  ...(await orig<object>()),
  extractPageWithAi: async (input: { pageNumber: number; role: string }) => ({ extraction: aiMock.extract!(input), model: "mock" }),
}));

const { prepareBatch } = await import("@/server/import/pdf-pipeline");
const { enqueue, JOBS } = await import("@/server/jobs/queue");
const { AiExtractionError } = await import("@/server/ai/extract-page");

async function pdf(pages: string[][], opts: { box?: boolean } = {}) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const lines of pages) {
    const page = doc.addPage([612, 792]);
    let y = 740;
    for (const line of lines) {
      if (line) page.drawText(line, { x: 60, y, size: 11, font });
      y -= 16;
    }
    if (opts.box) page.drawRectangle({ x: 306, y: 300, width: 200, height: 150, borderColor: rgb(0, 0, 0), borderWidth: 2 });
  }
  return new Uint8Array(await doc.save());
}

async function batchWith(files: { bytes: Uint8Array; kind: "QUESTIONS_PDF" | "ANSWER_KEY_PDF"; name: string }[], section: "RW" | "MATH" = "MATH") {
  const admin = await makeUser();
  const source = await db.source.create({ data: { name: "Booklet", owner: "Centre", rightsStatement: "ok", rightsConfirmedById: admin.id, rightsConfirmedAt: new Date() } });
  const batch = await db.importBatch.create({
    data: { kind: "PDF", sourceId: source.id, section, defaultDifficulty: "HARD", codePrefix: "PDF-", rightsConfirmedById: admin.id, rightsConfirmedAt: new Date(), createdById: admin.id },
  });
  let t = Date.now();
  for (const f of files) {
    const key = newStorageKey("sources", ".pdf");
    await storage().put(key, f.bytes, "application/pdf");
    await db.sourceFile.create({
      data: { sourceId: source.id, importBatchId: batch.id, kind: f.kind, storageKey: key, originalName: f.name, mimeType: "application/pdf", sizeBytes: f.bytes.length, sha256: "", uploadedById: admin.id, uploadedAt: new Date(t++) },
    });
  }
  return { batch, admin };
}

describe("PDF import pipeline", () => {
  beforeAll(() => {
    expect(process.env.JOBS_MODE).toBe("inline");
  });
  beforeEach(async () => {
    await resetDb();
    aiMock.available = false;
    aiMock.extract = null;
  });

  it("imports a typed booklet without AI: questions across pages, answer key, provenance, flags", async () => {
    const booklet = await pdf([
      ["1. If 2x + 3 = 11, what is the value of x?", "A) 3", "B) 4", "C) 7", "D) 8", "", "2. What is the value of 12 divided by 4?", "A) 2  B) 3  C) 4  D) 6", "", "3. A rectangle has a length of 5 and a width", "of 3. What is its area?", "A) 8"],
      ["B) 15", "C) 16", "D) 30", "", "4. How many minutes are in 2.5 hours?"],
    ]);
    const key = await pdf([["Answer Key", "1. B   2. B   3. B", "4. 150"]]);
    const { batch, admin } = await batchWith([
      { bytes: booklet, kind: "QUESTIONS_PDF", name: "booklet.pdf" },
      { bytes: key, kind: "ANSWER_KEY_PDF", name: "key.pdf" },
    ]);

    await prepareBatch(batch.id);

    const done = await db.importBatch.findUniqueOrThrow({ where: { id: batch.id } });
    expect(done.status).toBe("READY");
    expect(done.totalItems).toBe(3);
    const pages = await db.importPage.findMany({ where: { batchId: batch.id } });
    expect(pages.every((p) => p.status === "DONE" && p.method === "text" && p.imageKey)).toBe(true);

    const qs = await db.question.findMany({ where: { importBatchId: batch.id }, orderBy: { sourceRef: "asc" } });
    expect(qs.map((q) => q.sourceRef)).toEqual(["1", "2", "3", "4"]);
    expect(qs.map((q) => q.correctAnswers)).toEqual([["B"], ["B"], ["B"], ["150"]]);
    const q3 = qs[2]!;
    expect(q3.stem).toBe("A rectangle has a length of 5 and a width of 3. What is its area?");
    expect((q3.choices as { key: string; text: string }[]).map((c) => c.text)).toEqual(["8", "15", "16", "30"]);
    expect(q3.sourcePage).toBe(1);
    expect(qs[3]!.type).toBe("SPR");
    expect(qs[3]!.sourcePage).toBe(2);
    for (const q of qs) {
      expect(q).toMatchObject({ status: "DRAFT", origin: "IMPORTED", difficulty: "HARD", importedById: admin.id, section: "MATH" });
      expect(q.code).toMatch(/^PDF-ALG-\d{4}$/);
      expect(q.flags).toContain("TAXONOMY_UNCONFIRMED");
      expect(q.flags).not.toContain("MISSING_ANSWER");
    }
    expect(await db.questionVersion.count()).toBe(4);
    expect(done.log).toMatchObject({ created: 4, answersFromKey: 4, withoutAnswer: 0 });
  });

  it("marks scanned pages as needing AI when no API key is set", async () => {
    const scan = await pdf([[]], { box: true }); // no text layer at all
    const { batch } = await batchWith([{ bytes: scan, kind: "QUESTIONS_PDF", name: "scan.pdf" }]);
    await prepareBatch(batch.id);
    const page = await db.importPage.findFirstOrThrow({ where: { batchId: batch.id } });
    expect(page).toMatchObject({ status: "FAILED", error: "NO_TEXT_LAYER" });
    const done = await db.importBatch.findUniqueOrThrow({ where: { id: batch.id } });
    expect(done.status).toBe("READY");
    expect(done.log).toMatchObject({ created: 0, failedPages: [{ page: 1, error: "NO_TEXT_LAYER" }] });
  });

  it("uses the AI reader when available: LaTeX, uncertain text, cropped figures, suggested taxonomy", async () => {
    aiMock.available = true;
    aiMock.extract = () => ({
      pageType: "questions",
      questions: [
        {
          number: "7",
          continuesFromPreviousPage: false,
          continuesOnNextPage: false,
          type: "MCQ",
          passage: null,
          stem: "The graph of $y = f(x)$ is shown.\n\n[[FIGURE 1]]\n\nWhat is $f([[?2]])$?",
          choices: [
            { key: "A", text: "$1$" },
            { key: "B", text: "$2$" },
            { key: "C", text: "$3$" },
            { key: "D", text: "$4$" },
          ],
          answer: null,
          explanation: null,
          figures: [{ box: [0.5, 0.42, 0.83, 0.62], placement: "stem", description: "Graph of f" }],
          suggestedDomain: "ADVANCED_MATH",
          suggestedSkill: "NONLINEAR_FUNCTIONS",
        },
      ],
      answerKey: [{ part: null, number: "7", answer: "C", explanation: "Read the graph at x = 2." }],
    });
    const scan = await pdf([[]], { box: true });
    const { batch } = await batchWith([{ bytes: scan, kind: "QUESTIONS_PDF", name: "scan.pdf" }]);
    await prepareBatch(batch.id);

    const q = await db.question.findFirstOrThrow({ where: { importBatchId: batch.id }, include: { assets: true } });
    expect(q).toMatchObject({ domain: "ADVANCED_MATH", skill: "NONLINEAR_FUNCTIONS", correctAnswers: ["C"], explanation: "Read the graph at x = 2." });
    expect(q.assets).toHaveLength(1);
    expect(q.assets[0]!.width).toBeGreaterThan(100);
    expect(q.stem).toContain(`![Graph of f](asset:${q.assets[0]!.id})`);
    expect(q.stem).not.toContain("[[FIGURE");
    expect(q.flags).toEqual(expect.arrayContaining(["UNCERTAIN_TEXT", "TAXONOMY_UNCONFIRMED"]));
    expect(q.flags).not.toContain("MISSING_FIGURE");
    const page = await db.importPage.findFirstOrThrow({ where: { batchId: batch.id } });
    expect(page.method).toBe("ai");
  });

  it("retries a failing page, then records the failure and still finishes the batch", async () => {
    aiMock.available = true;
    let calls = 0;
    aiMock.extract = () => {
      calls++;
      throw new AiExtractionError("AI service unavailable", true);
    };
    const doc = await pdf([["1. Question one?"]]);
    const { batch } = await batchWith([{ bytes: doc, kind: "QUESTIONS_PDF", name: "q.pdf" }]);
    await prepareBatch(batch.id);
    expect(calls).toBe(3); // first try + 2 retries
    expect((await db.importPage.findFirstOrThrow({ where: { batchId: batch.id } })).status).toBe("FAILED");
    expect((await db.importBatch.findUniqueOrThrow({ where: { id: batch.id } })).status).toBe("READY");
  });

  it("refuses files that are not PDFs and never finalizes twice", async () => {
    const { batch } = await batchWith([{ bytes: new TextEncoder().encode("hello, not a pdf"), kind: "QUESTIONS_PDF", name: "fake.pdf" }]);
    await prepareBatch(batch.id);
    const failed = await db.importBatch.findUniqueOrThrow({ where: { id: batch.id } });
    expect(failed.status).toBe("FAILED");
    expect(failed.error).toBe("NOT_A_PDF:fake.pdf");

    const ok = await batchWith([{ bytes: await pdf([["1. Q?", "A) 1", "B) 2", "C) 3", "D) 4"]]), kind: "QUESTIONS_PDF", name: "ok.pdf" }]);
    await prepareBatch(ok.batch.id);
    await enqueue(JOBS.pdfFinalize, { batchId: ok.batch.id });
    expect(await db.question.count({ where: { importBatchId: ok.batch.id } })).toBe(1);
  });
});
