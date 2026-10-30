import type { AnswerKeyEntry, ExtractedFigure, ExtractedQuestion, PageExtraction } from "./pdf-schema";
import { normalizeKeyAnswer } from "./pdf-text";

/** One processed page, in document order (file order, then page number). */
export interface PageResult {
  fileId: string;
  role: "QUESTIONS" | "ANSWER_KEY";
  pageNumber: number;
  pageId: string;
  extraction: PageExtraction;
}

export interface PlacedFigure extends ExtractedFigure {
  pageId: string;
  pageNumber: number;
}

export interface AssembledQuestion extends Omit<ExtractedQuestion, "figures" | "continuesFromPreviousPage" | "continuesOnNextPage"> {
  fileId: string;
  /** Pages the question appears on (first is its provenance page). */
  pages: { pageId: string; pageNumber: number }[];
  figures: PlacedFigure[];
  /** Where the answer came from. */
  answerSource: "page" | "key" | null;
}

function join(a: string | null, b: string | null): string | null {
  const parts = [a, b].map((x) => x?.trim()).filter(Boolean);
  return parts.length ? parts.join("\n\n") : null;
}

function placed(q: ExtractedQuestion, page: PageResult): PlacedFigure[] {
  return q.figures.map((f) => ({ ...f, pageId: page.pageId, pageNumber: page.pageNumber }));
}

/**
 * Turn per-page questions into whole questions: a question that continues
 * from the previous page is merged into the last question of that file;
 * leading text with no previous question becomes a question of its own.
 */
export function assembleQuestions(pages: readonly PageResult[]): AssembledQuestion[] {
  const out: AssembledQuestion[] = [];
  let lastFile: string | null = null;
  for (const page of pages) {
    if (page.role !== "QUESTIONS") continue;
    for (const q of page.extraction.questions) {
      const prev = out.at(-1);
      const sameFile = prev && prev.fileId === page.fileId && lastFile === page.fileId;
      const isContinuation = q.number === null && q.continuesFromPreviousPage;
      if (isContinuation && prev && sameFile) {
        const choices = [...prev.choices];
        for (const c of q.choices) if (!choices.some((x) => x.key === c.key)) choices.push(c);
        prev.passage = join(prev.passage, q.passage);
        prev.stem = join(prev.stem, q.stem) ?? "";
        prev.choices = choices;
        prev.type = choices.length >= 2 ? "MCQ" : prev.type;
        prev.answer = prev.answer ?? q.answer;
        prev.explanation = join(prev.explanation, q.explanation);
        prev.figures.push(...placed(q, page));
        prev.suggestedDomain = prev.suggestedDomain ?? q.suggestedDomain;
        prev.suggestedSkill = prev.suggestedSkill ?? q.suggestedSkill;
        if (!prev.pages.some((p) => p.pageId === page.pageId)) prev.pages.push({ pageId: page.pageId, pageNumber: page.pageNumber });
        continue;
      }
      out.push({
        number: q.number,
        type: q.type,
        passage: q.passage,
        stem: q.stem,
        choices: [...q.choices],
        answer: q.answer,
        explanation: q.explanation,
        figures: placed(q, page),
        suggestedDomain: q.suggestedDomain,
        suggestedSkill: q.suggestedSkill,
        fileId: page.fileId,
        pages: [{ pageId: page.pageId, pageNumber: page.pageNumber }],
        answerSource: q.answer ? "page" : null,
      });
      lastFile = page.fileId;
    }
  }
  return out;
}

/** All answer-key entries in document order: key files first, then key pages inside question files. */
export function collectKeyEntries(pages: readonly PageResult[]): AnswerKeyEntry[] {
  const fromKeyFiles = pages.filter((p) => p.role === "ANSWER_KEY").flatMap((p) => p.extraction.answerKey);
  const fromBooklets = pages.filter((p) => p.role === "QUESTIONS").flatMap((p) => p.extraction.answerKey);
  return [...fromKeyFiles, ...fromBooklets];
}

export function normalizeNumber(n: string | null): string | null {
  if (!n) return null;
  const m = /(\d{1,3})/.exec(n);
  return m ? String(Number.parseInt(m[1]!, 10)) : null;
}

/**
 * Fill in answers (and explanations) from the key, by question number.
 * When numbers repeat (e.g. each module restarts at 1), entries are used in
 * order: the first question 1 gets the first key entry for 1, and so on.
 * An answer printed next to the question itself is kept.
 */
export function matchAnswers(questions: AssembledQuestion[], entries: readonly AnswerKeyEntry[]) {
  const queues = new Map<string, AnswerKeyEntry[]>();
  for (const e of entries) {
    const n = normalizeNumber(e.number);
    if (!n) continue;
    queues.set(n, [...(queues.get(n) ?? []), e]);
  }
  let matched = 0;
  for (const q of questions) {
    const n = normalizeNumber(q.number);
    const entry = n ? queues.get(n)?.shift() : undefined;
    if (!entry) continue;
    if (!q.answer) {
      q.answer = entry.answer;
      q.answerSource = "key";
      matched++;
    }
    if (!q.explanation && entry.explanation) q.explanation = entry.explanation;
  }
  const unused = [...queues.values()].reduce((s, list) => s + list.length, 0);
  return { matched, unusedKeyEntries: unused };
}

/** Correct answers in the form the question bank stores them. */
export function answersFor(q: Pick<AssembledQuestion, "type" | "answer">): string[] {
  if (!q.answer) return [];
  const normalized = normalizeKeyAnswer(q.answer);
  if (q.type === "MCQ") {
    const letter = /^[A-D]$/.exec(normalized.toUpperCase());
    return letter ? [letter[0]] : [normalized];
  }
  return normalized
    .split(/;\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}
