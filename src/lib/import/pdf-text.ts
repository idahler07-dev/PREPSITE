import type { AnswerKeyEntry, ExtractedQuestion, PageExtraction } from "./pdf-schema";

/**
 * Parse a typed PDF page from its text layer, without AI. Good enough for
 * cleanly typed booklets ("1. … A) … B) …"); math is kept as plain text and
 * every question still goes through human review. Scanned pages have no
 * text layer and need the AI reader.
 */

/** A text item as returned by pdf.js getTextContent(). */
export interface PdfTextItem {
  str: string;
  /** [a, b, c, d, x, y] — x/y are the baseline position in PDF units (origin bottom-left). */
  transform: number[];
  width: number;
  height: number;
  hasEOL?: boolean;
}

export interface TextLine {
  text: string;
  x: number;
  y: number;
  height: number;
}

/** Group text items into visual lines, top to bottom, left to right. */
export function itemsToLines(items: readonly PdfTextItem[]): TextLine[] {
  const cleaned = items
    .filter((i) => i.str.trim().length > 0)
    .map((i) => ({ str: i.str, x: i.transform[4] ?? 0, y: i.transform[5] ?? 0, w: i.width, h: Math.abs(i.height || i.transform[3] || 10) }));
  cleaned.sort((a, b) => b.y - a.y || a.x - b.x);

  const lines: { items: typeof cleaned; y: number; h: number }[] = [];
  for (const it of cleaned) {
    const line = lines.find((l) => Math.abs(l.y - it.y) <= Math.max(2, Math.min(l.h, it.h) * 0.45));
    if (line) {
      line.items.push(it);
      line.h = Math.max(line.h, it.h);
    } else lines.push({ items: [it], y: it.y, h: it.h });
  }
  lines.sort((a, b) => b.y - a.y);

  return lines.map((l) => {
    l.items.sort((a, b) => a.x - b.x);
    let text = "";
    let end = -Infinity;
    for (const it of l.items) {
      const gap = it.x - end;
      if (text && gap > it.h * 0.15 && !text.endsWith(" ") && !it.str.startsWith(" ")) text += " ";
      text += it.str;
      end = it.x + it.w;
    }
    return { text: text.replace(/\s+/g, " ").trim(), x: l.items[0]!.x, y: l.y, height: l.h };
  });
}

/** Plain text of a page (lines joined, blank line between paragraphs). */
export function linesToText(lines: readonly TextLine[]): string {
  return splitParagraphs(lines)
    .map((p) => p.map((l) => l.text).join("\n"))
    .join("\n\n");
}

/** Usual distance between consecutive lines (lower median, so paragraph gaps don't inflate it). */
export function typicalLineGap(lines: readonly TextLine[]): number {
  const gaps = lines
    .slice(1)
    .map((l, i) => lines[i]!.y - l.y)
    .filter((g) => g > 0)
    .sort((a, b) => a - b);
  return gaps.length ? gaps[Math.floor((gaps.length - 1) / 2)]! : 0;
}

/** Split lines into paragraphs at vertical gaps noticeably larger than normal line spacing. */
export function splitParagraphs(lines: readonly TextLine[], typical = typicalLineGap(lines)): TextLine[][] {
  if (lines.length === 0) return [];
  const gaps = lines.slice(1).map((l, i) => lines[i]!.y - l.y);
  const paragraphs: TextLine[][] = [[lines[0]!]];
  lines.slice(1).forEach((l, i) => {
    const gap = gaps[i]!;
    if (typical > 0 && gap > typical * 1.6) paragraphs.push([l]);
    else paragraphs.at(-1)!.push(l);
  });
  return paragraphs;
}

// "12. text" or "12) text" — the number must be followed by a space (so "3.5 hours" is not question 3).
const QUESTION_START = /^\s*(?:Question\s+)?(\d{1,3})\s*[.)](?:\s+|$)(.*)$/i;
const CHOICE_START = /^\s*\(?([A-D])\s*[).:]\s*(.*)$/;
const INLINE_CHOICE = /(?:^|\s)\(?([A-D])\s*[).]\s*/g;
const ANSWER_LINE = /^\s*(?:correct\s+)?answer\s*[:.-]\s*(.+)$/i;
const EXPLANATION_LINE = /^\s*(?:explanation|rationale|solution)\s*[:.-]\s*(.*)$/i;

/** "A) 2  B) 3  C) 4  D) 6" → [{A,"2"},{B,"3"},…] when the labels appear in order. */
export function splitInlineChoices(text: string): { key: "A" | "B" | "C" | "D"; text: string }[] | null {
  const marks = [...text.matchAll(INLINE_CHOICE)];
  if (marks.length < 2) return null;
  const keys = marks.map((m) => m[1]);
  const expected = ["A", "B", "C", "D"].slice(keys.indexOf("A") === 0 ? 0 : -1);
  if (keys[0] !== "A" || keys.some((k, i) => k !== expected[i])) return null;
  return marks.map((m, i) => {
    const start = m.index! + m[0].length;
    const end = i + 1 < marks.length ? marks[i + 1]!.index! : text.length;
    return { key: m[1] as "A", text: text.slice(start, end).trim() };
  });
}

interface Draft {
  number: string | null;
  bodyLines: TextLine[];
  choices: { key: "A" | "B" | "C" | "D"; text: string }[];
  answer: string | null;
  explanation: string[];
  mode: "body" | "choices" | "explanation";
}

function newDraft(number: string | null, firstLine?: TextLine): Draft {
  return { number, bodyLines: firstLine ? [firstLine] : [], choices: [], answer: null, explanation: [], mode: "body" };
}

function finishDraft(d: Draft, section: "RW" | "MATH" | null, opts: { continuesFromPreviousPage: boolean; lineGap: number }): ExtractedQuestion {
  const paragraphs = splitParagraphs(d.bodyLines, opts.lineGap).map((p) => p.map((l) => l.text).join(" ").trim()).filter(Boolean);
  let passage: string | null = null;
  let stem = paragraphs.join("\n\n");
  if (section === "RW" && paragraphs.length >= 2) {
    stem = paragraphs.at(-1)!;
    passage = paragraphs.slice(0, -1).join("\n\n");
  }
  return {
    number: d.number,
    continuesFromPreviousPage: opts.continuesFromPreviousPage,
    continuesOnNextPage: false,
    type: d.choices.length >= 2 ? "MCQ" : "SPR",
    passage,
    stem,
    choices: d.choices,
    answer: d.answer,
    explanation: d.explanation.length ? d.explanation.join(" ").trim() : null,
    figures: [],
    suggestedDomain: null,
    suggestedSkill: null,
  };
}

/** Questions on a typed page. Text before the first number is returned as a continuation (number null). */
export function parseQuestionLines(lines: readonly TextLine[], section: "RW" | "MATH" | null): ExtractedQuestion[] {
  const out: ExtractedQuestion[] = [];
  let current: Draft | null = null;
  let leading = true;
  const lineGap = typicalLineGap(lines);

  const push = () => {
    if (!current) return;
    const hasContent = current.bodyLines.length || current.choices.length;
    if (hasContent) out.push(finishDraft(current, section, { continuesFromPreviousPage: current.number === null && leading, lineGap }));
  };

  for (const line of lines) {
    const q = QUESTION_START.exec(line.text);
    // Numbers must increase on a page, so numbered steps inside an explanation don't start questions.
    const lastNumber = current?.number ? Number(current.number) : null;
    if (q && (lastNumber === null || Number(q[1]) > lastNumber)) {
      push();
      leading = false;
      current = newDraft(q[1]!, q[2] ? { ...line, text: q[2] } : undefined);
      continue;
    }
    if (!current) current = newDraft(null);

    const ans = ANSWER_LINE.exec(line.text);
    if (ans) {
      current.answer = ans[1]!.trim();
      current.mode = "explanation";
      continue;
    }
    const expl = EXPLANATION_LINE.exec(line.text);
    if (expl) {
      current.mode = "explanation";
      if (expl[1]) current.explanation.push(expl[1]);
      continue;
    }
    if (current.mode === "explanation") {
      current.explanation.push(line.text);
      continue;
    }
    const inline = splitInlineChoices(line.text);
    if (inline) {
      current.choices.push(...inline);
      current.mode = "choices";
      continue;
    }
    const c = CHOICE_START.exec(line.text);
    // Choices start at A — except at the top of a page, where a question's choices may continue (B, C, D).
    const pageTopContinuation = current.number === null && current.bodyLines.length === 0 && current.choices.length === 0;
    if (c && (current.mode === "choices" || c[1] === "A" || pageTopContinuation)) {
      current.choices.push({ key: c[1] as "A", text: c[2]!.trim() });
      current.mode = "choices";
      continue;
    }
    if (current.mode === "choices" && current.choices.length) {
      // A wrapped choice continues on the next line.
      const last = current.choices.at(-1)!;
      last.text = `${last.text} ${line.text}`.trim();
      continue;
    }
    current.bodyLines.push(line);
  }
  push();
  return out;
}

// ─── Answer keys ─────────────────────────────────────────────────────────────

const NUM = String.raw`-?(?:\d+(?:\.\d+)?|\.\d+)(?:\/\d+)?`;
const ANSWER_VALUE = String.raw`(?:\(?[A-D]\)?(?![A-Za-z])|${NUM}(?:\s*(?:or|;|\|)\s*${NUM})*)`;
const KEY_ENTRY = new RegExp(String.raw`(?:^|[\s,;|])(?:Q(?:uestion)?\s*)?(\d{1,3})\s*[.):\-–]?\s+(?:Answer\s*:?\s*)?(${ANSWER_VALUE})(?=$|[\s,;|])`, "gi");
const PART_LABEL = /^\s*((?:module|section|part)\s*\d+[^\n]{0,40}|reading\s+and\s+writing[^\n]{0,30}|math(?:ematics)?[^\n]{0,30})\s*$/i;

/** Normalize an answer written in a key: "(b)" → "B"; "3/4 or .75" → "3/4; .75". */
export function normalizeKeyAnswer(raw: string): string {
  const t = raw.trim();
  const letter = /^\(?([A-Da-d])\)?$/.exec(t);
  if (letter) return letter[1]!.toUpperCase();
  return t
    .split(/\s*(?:;|\bor\b|\|)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean)
    .join("; ");
}

/** Find "1. B", "2) 3/4", "Question 3: C", "4 – D" style entries, keeping document order and part labels. */
export function parseAnswerKeyText(text: string): AnswerKeyEntry[] {
  const entries: AnswerKeyEntry[] = [];
  let part: string | null = null;
  for (const rawLine of text.split(/\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const label = PART_LABEL.exec(line);
    if (label && !new RegExp(KEY_ENTRY.source, "i").test(line.replace(/^(module|section|part)\s*\d+/i, ""))) {
      part = label[1]!.trim();
      continue;
    }
    const matches = [...line.matchAll(new RegExp(KEY_ENTRY.source, "gi"))];
    if (matches.length === 0) {
      // Text after an entry is its explanation.
      const last = entries.at(-1);
      if (last && line.length > 3) last.explanation = last.explanation ? `${last.explanation} ${line}` : line;
      continue;
    }
    matches.forEach((m, i) => {
      const after = i === matches.length - 1 ? line.slice(m.index! + m[0].length).trim() : "";
      entries.push({
        part,
        number: String(Number.parseInt(m[1]!, 10)),
        answer: normalizeKeyAnswer(m[2]!),
        explanation: after.length > 3 ? after.replace(/^[-–:.]\s*/, "") : null,
      });
    });
  }
  return entries;
}

/** Decide what a typed page is and extract it. */
export function extractFromTextLayer(lines: readonly TextLine[], opts: { role: "QUESTIONS" | "ANSWER_KEY"; section: "RW" | "MATH" | null }): PageExtraction {
  const text = linesToText(lines);
  if (opts.role === "ANSWER_KEY") {
    return { pageType: "answer_key", questions: [], answerKey: parseAnswerKeyText(text) };
  }
  const questions = parseQuestionLines(lines, opts.section);
  const withChoices = questions.filter((q) => q.choices.length >= 2).length;
  const key = parseAnswerKeyText(text);
  // A page full of "n. X" pairs and almost no real questions is an answer key inside the booklet.
  if (key.length >= 5 && withChoices <= 1 && key.length > questions.length * 2) {
    return { pageType: "answer_key", questions: [], answerKey: key };
  }
  return { pageType: questions.length ? "questions" : "other", questions, answerKey: [] };
}
