import { describe, expect, it } from "vitest";
import {
  extractFromTextLayer,
  itemsToLines,
  normalizeKeyAnswer,
  parseAnswerKeyText,
  parseQuestionLines,
  splitInlineChoices,
  type PdfTextItem,
  type TextLine,
} from "@/lib/import/pdf-text";
import { answersFor, assembleQuestions, collectKeyEntries, matchAnswers, type PageResult } from "@/lib/import/assemble";
import { normalizeBox, pageExtractionSchema, type ExtractedQuestion } from "@/lib/import/pdf-schema";

/** Lines at 14pt spacing; "" makes a paragraph gap. */
function lines(texts: string[]): TextLine[] {
  let y = 760;
  const out: TextLine[] = [];
  for (const t of texts) {
    if (t === "") {
      y -= 14;
      continue;
    }
    out.push({ text: t, x: 60, y, height: 12 });
    y -= 14;
  }
  return out;
}

const item = (str: string, x: number, y: number, w = str.length * 6): PdfTextItem => ({ str, transform: [12, 0, 0, 12, x, y], width: w, height: 12 });

describe("text layer → lines", () => {
  it("groups items on the same baseline and orders top to bottom", () => {
    const out = itemsToLines([item("world", 100, 700), item("Hello", 60, 700, 30), item("Next line", 60, 686)]);
    expect(out.map((l) => l.text)).toEqual(["Hello world", "Next line"]);
  });

  it("does not insert spaces inside tightly kerned words", () => {
    const out = itemsToLines([item("Exam", 60, 700, 24), item("ple", 84, 700, 18)]);
    expect(out[0]!.text).toBe("Example");
  });
});

describe("question parsing (typed PDFs, no AI)", () => {
  it("parses numbered questions with A–D choices on separate lines", () => {
    const qs = parseQuestionLines(lines(["1. If 2x + 3 = 11, what is x?", "A) 3", "B) 4", "C) 7", "D) 8", "2. What is 12 / 4?", "(A) 2", "(B) 3", "(C) 4", "(D) 6"]), "MATH");
    expect(qs).toHaveLength(2);
    expect(qs[0]).toMatchObject({ number: "1", type: "MCQ", stem: "If 2x + 3 = 11, what is x?" });
    expect(qs[0]!.choices.map((c) => `${c.key}:${c.text}`)).toEqual(["A:3", "B:4", "C:7", "D:8"]);
    expect(qs[1]!.choices).toHaveLength(4);
  });

  it("splits several choices written on one line", () => {
    expect(splitInlineChoices("A) 2  B) 3  C) 4  D) 6")).toEqual([
      { key: "A", text: "2" },
      { key: "B", text: "3" },
      { key: "C", text: "4" },
      { key: "D", text: "6" },
    ]);
    expect(splitInlineChoices("A store sells B) items")).toBeNull();
  });

  it("joins wrapped choices and multi-line stems", () => {
    const qs = parseQuestionLines(lines(["3. A long question that", "wraps onto a second line?", "A) first choice that", "keeps going", "B) second", "C) third", "D) fourth"]), "MATH");
    expect(qs[0]!.stem).toBe("A long question that wraps onto a second line?");
    expect(qs[0]!.choices[0]!.text).toBe("first choice that keeps going");
  });

  it("treats a question without choices as student-produced response", () => {
    const qs = parseQuestionLines(lines(["4. What is the value of 3/4 as a decimal?"]), "MATH");
    expect(qs[0]!.type).toBe("SPR");
  });

  it("does not mistake decimals or explanation steps for new questions", () => {
    const qs = parseQuestionLines(lines(["5. A car travels for", "3.5 hours. How far does it go?", "Answer: 210", "Explanation: two steps", "1. Multiply 60 by 3.5"]), "MATH");
    expect(qs).toHaveLength(1);
    expect(qs[0]!.stem).toContain("3.5 hours");
    expect(qs[0]!.answer).toBe("210");
    expect(qs[0]!.explanation).toContain("Multiply 60 by 3.5");
  });

  it("separates passage and question for Reading and Writing", () => {
    const qs = parseQuestionLines(
      lines(["6. Snow leopards live in high mountains where", "prey is scarce.", "", "Which choice completes the text?", "A) As a result,", "B) However,", "C) For example,", "D) Similarly,"]),
      "RW",
    );
    expect(qs[0]!.passage).toBe("Snow leopards live in high mountains where prey is scarce.");
    expect(qs[0]!.stem).toBe("Which choice completes the text?");
  });

  it("continues choices at the top of a page", () => {
    const qs = parseQuestionLines(lines(["B) 15", "C) 16", "D) 30", "4. Next?"]), "MATH");
    expect(qs[0]).toMatchObject({ number: null, continuesFromPreviousPage: true, stem: "" });
    expect(qs[0]!.choices.map((c) => c.key)).toEqual(["B", "C", "D"]);
  });

  it("returns text before the first number as a continuation", () => {
    const qs = parseQuestionLines(lines(["C) 7", "D) 8", "7. Next question?", "A) 1", "B) 2", "C) 3", "D) 4"]), "MATH");
    expect(qs[0]).toMatchObject({ number: null, continuesFromPreviousPage: true });
    expect(qs[1]!.number).toBe("7");
  });
});

describe("answer keys", () => {
  it("reads common key formats in order, with parts and SPR answers", () => {
    const entries = parseAnswerKeyText(["Answer Key", "Module 1", "1. B   2. C   3) A", "4 – D", "Question 5: 3/4 or .75", "Module 2", "1. D", "2. -2"].join("\n"));
    expect(entries.map((e) => `${e.part}|${e.number}|${e.answer}`)).toEqual([
      "Module 1|1|B",
      "Module 1|2|C",
      "Module 1|3|A",
      "Module 1|4|D",
      "Module 1|5|3/4; .75",
      "Module 2|1|D",
      "Module 2|2|-2",
    ]);
  });

  it("keeps explanations written after an entry", () => {
    const entries = parseAnswerKeyText("1. B Subtract 3 from both sides.\nThen divide by 2.\n2. C");
    expect(entries[0]).toMatchObject({ number: "1", answer: "B", explanation: "Subtract 3 from both sides. Then divide by 2." });
    expect(entries[1]!.explanation).toBeNull();
  });

  it("normalizes answers", () => {
    expect(normalizeKeyAnswer("(b)")).toBe("B");
    expect(normalizeKeyAnswer("3/4 or 0.75")).toBe("3/4; 0.75");
  });

  it("recognizes an answer-key page inside a question booklet", () => {
    const page = extractFromTextLayer(lines(["Answers", "1. B 2. C 3. A 4. D", "5. B 6. C 7. A 8. 12"]), { role: "QUESTIONS", section: "MATH" });
    expect(page.pageType).toBe("answer_key");
    expect(page.answerKey).toHaveLength(8);
  });
});

function q(over: Partial<ExtractedQuestion>): ExtractedQuestion {
  return {
    number: "1",
    continuesFromPreviousPage: false,
    continuesOnNextPage: false,
    type: "MCQ",
    passage: null,
    stem: "Q",
    choices: [],
    answer: null,
    explanation: null,
    figures: [],
    suggestedDomain: null,
    suggestedSkill: null,
    ...over,
  };
}

const page = (n: number, questions: ExtractedQuestion[], role: "QUESTIONS" | "ANSWER_KEY" = "QUESTIONS", answerKey: PageResult["extraction"]["answerKey"] = []): PageResult => ({
  fileId: role === "QUESTIONS" ? "f1" : "k1",
  role,
  pageNumber: n,
  pageId: `${role}-${n}`,
  extraction: { pageType: role === "QUESTIONS" ? "questions" : "answer_key", questions, answerKey },
});

describe("assembling questions across pages", () => {
  it("merges a question that continues onto the next page", () => {
    const out = assembleQuestions([
      page(1, [q({ number: "1", passage: "First half of the passage.", stem: "", continuesOnNextPage: true, figures: [{ box: [0.1, 0.5, 0.9, 0.9], placement: "passage", description: "graph" }] })]),
      page(2, [
        q({ number: null, continuesFromPreviousPage: true, passage: "Second half.", stem: "Which choice?", choices: [{ key: "A", text: "x" }, { key: "B", text: "y" }, { key: "C", text: "z" }, { key: "D", text: "w" }] }),
        q({ number: "2", stem: "Next" }),
      ]),
    ]);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ passage: "First half of the passage.\n\nSecond half.", stem: "Which choice?", type: "MCQ" });
    expect(out[0]!.pages.map((p) => p.pageNumber)).toEqual([1, 2]);
    expect(out[0]!.figures[0]!.pageNumber).toBe(1);
  });

  it("matches answers by number, in order when numbering restarts", () => {
    const qs = assembleQuestions([page(1, [q({ number: "1" }), q({ number: "2", type: "SPR" })]), page(2, [q({ number: "1" }), q({ number: "2", answer: "C" })])]);
    const keys = collectKeyEntries([
      page(1, [], "ANSWER_KEY", [
        { part: "Module 1", number: "1", answer: "B", explanation: "Because." },
        { part: "Module 1", number: "2", answer: "3/4; .75", explanation: null },
        { part: "Module 2", number: "01", answer: "D", explanation: null },
        { part: "Module 2", number: "2", answer: "A", explanation: null },
      ]),
    ]);
    const stats = matchAnswers(qs, keys);
    expect(qs.map((x) => x.answer)).toEqual(["B", "3/4; .75", "D", "C"]);
    expect(qs[0]!.explanation).toBe("Because.");
    expect(qs[3]!.answerSource).toBe("page"); // printed answer wins over the key
    expect(stats).toEqual({ matched: 3, unusedKeyEntries: 0 });
    expect(answersFor(qs[1]!)).toEqual(["3/4", ".75"]);
    expect(answersFor({ type: "MCQ", answer: "(b)" })).toEqual(["B"]);
  });
});

describe("figure boxes and AI output validation", () => {
  it("clamps, orders and pads boxes; accepts percentages; rejects tiny boxes", () => {
    expect(normalizeBox([0.9, 0.8, 0.1, 0.2], 0)).toEqual([0.1, 0.2, 0.9, 0.8]);
    expect(normalizeBox([10, 20, 90, 80], 0)).toEqual([0.1, 0.2, 0.9, 0.8]);
    expect(normalizeBox([-0.1, 0, 1.2, 0.5], 0.01)).toEqual([0, 0, 1, 0.51]);
    expect(normalizeBox([0.5, 0.5, 0.505, 0.6])).toBeNull();
    expect(normalizeBox([0.1, 0.2, 0.3])).toBeNull();
  });

  it("validates extraction JSON", () => {
    expect(pageExtractionSchema.safeParse({ pageType: "questions", questions: [q({})], answerKey: [] }).success).toBe(true);
    expect(pageExtractionSchema.safeParse({ pageType: "questions", questions: [q({ suggestedSkill: "MADE_UP" as never })], answerKey: [] }).success).toBe(false);
  });
});
