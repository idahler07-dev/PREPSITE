import { parseAccepted } from "./spr";

/**
 * Automatic review flags. "Blocking" flags must be fixed before a question can
 * be published; the others are warnings a reviewer acknowledges by approving.
 */
export const FLAGS = {
  MISSING_ANSWER: { blocking: true },
  UNCERTAIN_TEXT: { blocking: true },
  CHOICE_COUNT: { blocking: true },
  ANSWER_NOT_IN_CHOICES: { blocking: true },
  INVALID_SPR_ANSWER: { blocking: true },
  MISSING_FIGURE: { blocking: false },
  DUPLICATE_CODE: { blocking: false },
  NEAR_DUPLICATE: { blocking: false },
  TAXONOMY_UNCONFIRMED: { blocking: false },
  STUDENT_REPORT: { blocking: false },
  DIFFICULTY_MISMATCH: { blocking: false },
} as const;

export type Flag = keyof typeof FLAGS;
export const ALL_FLAGS = Object.keys(FLAGS) as Flag[];

/** Flags recomputed from the content on every save. */
export const CONTENT_FLAGS: readonly Flag[] = [
  "MISSING_ANSWER",
  "UNCERTAIN_TEXT",
  "CHOICE_COUNT",
  "ANSWER_NOT_IN_CHOICES",
  "INVALID_SPR_ANSWER",
  "MISSING_FIGURE",
];

export function isBlocking(flag: string): boolean {
  return (FLAGS as Record<string, { blocking: boolean }>)[flag]?.blocking ?? false;
}

export function blockingFlags(flags: readonly string[]): string[] {
  return flags.filter(isBlocking);
}

/**
 * Text the extractor was unsure about is wrapped like [[?text]].
 * Reviewers must confirm it (remove the marker) before publishing.
 */
export const UNCERTAIN_MARKER = /\[\[\?([\s\S]*?)\]\]/g;

const FIGURE_WORDS =
  /\b(figure|graph(ed)?|diagram|table|scatterplot|bar chart|line chart|histogram|dot plot|box plot|shown (above|below|in the))\b/i;
const HAS_IMAGE = /!\[[^\]]*\]\([^)]+\)/;
const HAS_TABLE = /^\s*\|.*\|\s*$\n^\s*\|?\s*:?-{3,}/m;

export interface FlaggableContent {
  type: "MCQ" | "SPR";
  passage?: string | null;
  stem: string;
  choices?: readonly { key: string; text: string }[] | null;
  correctAnswers: readonly string[];
  explanation?: string | null;
  /** Number of images attached to the question. */
  assetCount?: number;
}

export function computeContentFlags(q: FlaggableContent): Flag[] {
  const flags: Flag[] = [];
  const answers = q.correctAnswers.map((a) => a.trim()).filter(Boolean);
  const allText = [q.passage, q.stem, ...(q.choices ?? []).map((c) => c.text)].filter(Boolean).join("\n");

  if (answers.length === 0) flags.push("MISSING_ANSWER");

  if (new RegExp(UNCERTAIN_MARKER.source).test([allText, q.explanation ?? ""].join("\n"))) flags.push("UNCERTAIN_TEXT");

  if (q.type === "MCQ") {
    const choices = q.choices ?? [];
    const keys = choices.map((c) => c.key.toUpperCase());
    const complete = choices.length === 4 && choices.every((c) => c.text.trim().length > 0);
    const distinctKeys = new Set(keys).size === 4 && ["A", "B", "C", "D"].every((k) => keys.includes(k));
    if (!complete || !distinctKeys) flags.push("CHOICE_COUNT");
    if (answers.length > 0 && answers.some((a) => !keys.includes(a.toUpperCase()))) flags.push("ANSWER_NOT_IN_CHOICES");
  } else if (answers.length > 0 && answers.some((a) => parseAccepted(a) === null)) {
    flags.push("INVALID_SPR_ANSWER");
  }

  const mentionsFigure = FIGURE_WORDS.test(allText);
  const hasVisual = HAS_IMAGE.test(allText) || HAS_TABLE.test(allText) || (q.assetCount ?? 0) > 0;
  if (mentionsFigure && !hasVisual) flags.push("MISSING_FIGURE");

  return flags;
}

/** Merge recomputed content flags with process flags (reports, duplicates...) that persist until cleared. */
export function mergeFlags(previous: readonly string[], content: readonly Flag[]): string[] {
  const kept = previous.filter((f) => !(CONTENT_FLAGS as readonly string[]).includes(f));
  return [...new Set([...content, ...kept])].sort();
}
