import Papa from "papaparse";
import { domainOfSkill, domainsForSection, getDomain, resolveDomainKey, resolveSkillKey, type SectionKey } from "@/lib/taxonomy";
import { computeContentFlags, type Flag } from "@/lib/questions/flags";
import { CODE_PATTERN, codeTemplate, normalizeCode, suggestCodes } from "@/lib/questions/codes";
import type { Choice } from "@/lib/questions/schema";

/** Columns of the import template, in order. */
export const TEMPLATE_COLUMNS = [
  "code",
  "section",
  "domain",
  "skill",
  "difficulty",
  "type",
  "passage",
  "stem",
  "choice_a",
  "choice_b",
  "choice_c",
  "choice_d",
  "correct_answer",
  "explanation",
  "image_url",
] as const;

/** Optional extra columns we also understand. */
export const OPTIONAL_COLUMNS = ["tags", "rationale_a", "rationale_b", "rationale_c", "rationale_d"] as const;

export type RawRow = Record<string, string>;

export type RowErrorCode =
  | "MISSING_STEM"
  | "INVALID_SECTION"
  | "MISSING_SECTION"
  | "INVALID_DOMAIN"
  | "INVALID_SKILL"
  | "MISSING_TAXONOMY"
  | "INVALID_DIFFICULTY"
  | "INVALID_TYPE"
  | "INVALID_IMAGE_URL";

export type RowWarningCode = "CODE_REASSIGNED" | "CODE_INVALID" | "CODE_GENERATED" | "DIFFICULTY_DEFAULTED" | "TYPE_INFERRED";

export interface NormalizedRow {
  rowNumber: number;
  requestedCode: string | null;
  section: SectionKey;
  domain: string;
  skill: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  type: "MCQ" | "SPR";
  passage: string | null;
  stem: string;
  choices: Choice[] | null;
  correctAnswers: string[];
  explanation: string | null;
  wrongChoiceRationales: Partial<Record<"A" | "B" | "C" | "D", string>> | null;
  tags: string[];
  imageUrl: string | null;
}

export interface RowResult {
  rowNumber: number;
  errors: RowErrorCode[];
  warnings: RowWarningCode[];
  flags: Flag[];
  row: NormalizedRow | null;
  /** Final code after assignment (set by assignCodes). */
  code?: string;
}

export interface ImportDefaults {
  section?: SectionKey | null;
  difficulty?: "EASY" | "MEDIUM" | "HARD" | null;
  codePrefix: string;
}

/** Header names are matched loosely: "Choice A", "choice-a", "CHOICE_A" all work. */
export function normalizeHeader(h: string): string {
  return h
    .replace(/^﻿/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export function parseCsv(text: string): { headers: string[]; rows: RawRow[] } {
  const result = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normalizeHeader,
  });
  const headers = (result.meta.fields ?? []).map(normalizeHeader);
  const rows = result.data.map((r) => {
    const out: RawRow = {};
    for (const [k, v] of Object.entries(r)) out[k] = v == null ? "" : String(v);
    return out;
  });
  return { headers, rows };
}

export function missingRequiredColumns(headers: string[]): string[] {
  const required = ["stem", "correct_answer"];
  return required.filter((c) => !headers.includes(c));
}

function cell(r: RawRow, key: string): string {
  return (r[key] ?? "").replace(/\r\n/g, "\n").trim();
}

export function parseSection(v: string): SectionKey | null {
  const s = v.toLowerCase().replace(/[^a-z]/g, "");
  if (!s) return null;
  if (["rw", "readingandwriting", "readingwriting", "reading", "writing", "ebrw", "english", "verbal"].includes(s)) return "RW";
  if (["math", "maths", "mathematics", "m"].includes(s)) return "MATH";
  return null;
}

export function parseDifficulty(v: string): "EASY" | "MEDIUM" | "HARD" | null {
  const s = v.toLowerCase().trim();
  if (["easy", "e", "1", "low"].includes(s)) return "EASY";
  if (["medium", "m", "2", "med", "moderate"].includes(s)) return "MEDIUM";
  if (["hard", "h", "3", "high", "difficult"].includes(s)) return "HARD";
  return null;
}

export function parseType(v: string): "MCQ" | "SPR" | null {
  const s = v.toLowerCase().replace(/[^a-z]/g, "");
  if (!s) return null;
  if (["mcq", "mc", "multiplechoice", "choice"].includes(s)) return "MCQ";
  if (["spr", "gridin", "grid", "studentproducedresponse", "studentproduced", "open", "freeresponse"].includes(s)) return "SPR";
  return null;
}

export function parseMcqAnswer(v: string): string[] {
  const letters = v.toUpperCase().match(/\b[A-D]\b/g);
  return letters ? [...new Set(letters)] : v.trim() ? [v.trim().toUpperCase()] : [];
}

export function parseSprAnswers(v: string): string[] {
  return v
    .split(/[;|\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Validate and normalize one spreadsheet row. Pure; no database access. */
export function normalizeRow(
  raw: RawRow,
  rowNumber: number,
  defaults: ImportDefaults,
  englishNames: { domains: Record<string, string>; skills: Record<string, string> },
): RowResult {
  const errors: RowErrorCode[] = [];
  const warnings: RowWarningCode[] = [];

  const stem = cell(raw, "stem");
  if (!stem) errors.push("MISSING_STEM");

  const sectionCell = cell(raw, "section");
  let section = sectionCell ? parseSection(sectionCell) : (defaults.section ?? null);
  if (sectionCell && !section) errors.push("INVALID_SECTION");

  // Domain / skill: accept keys, short codes or English names; infer domain from skill.
  const domainCell = cell(raw, "domain");
  const skillCell = cell(raw, "skill");
  let domain = domainCell ? resolveDomainKey(domainCell, englishNames.domains) : undefined;
  const skill = skillCell ? resolveSkillKey(skillCell, englishNames.skills) : undefined;
  if (domainCell && !domain) errors.push("INVALID_DOMAIN");
  if (skillCell && !skill) errors.push("INVALID_SKILL");
  if (!domain && skill) domain = domainOfSkill(skill)?.key;
  if (!section && domain) section = getDomain(domain)?.section ?? null;
  if (!section && !sectionCell) errors.push("MISSING_SECTION");
  if (!domainCell && !skillCell) errors.push("MISSING_TAXONOMY");
  if (domain && skill && domainOfSkill(skill)?.key !== domain) errors.push("INVALID_SKILL");
  if (domain && section && getDomain(domain)?.section !== section) errors.push("INVALID_DOMAIN");
  if (domain && !skill && !skillCell) errors.push("MISSING_TAXONOMY");

  const diffCell = cell(raw, "difficulty");
  let difficulty = diffCell ? parseDifficulty(diffCell) : null;
  if (diffCell && !difficulty) errors.push("INVALID_DIFFICULTY");
  if (!diffCell) {
    difficulty = defaults.difficulty ?? "MEDIUM";
    warnings.push("DIFFICULTY_DEFAULTED");
  }

  const choiceTexts = (["a", "b", "c", "d"] as const).map((k) => cell(raw, `choice_${k}`));
  const typeCell = cell(raw, "type");
  let type = typeCell ? parseType(typeCell) : null;
  if (typeCell && !type) errors.push("INVALID_TYPE");
  if (!typeCell) {
    type = choiceTexts.some(Boolean) ? "MCQ" : "SPR";
    warnings.push("TYPE_INFERRED");
  }

  const imageUrl = cell(raw, "image_url") || null;
  if (imageUrl && !/^https:\/\/[^\s]+$/i.test(imageUrl)) errors.push("INVALID_IMAGE_URL");

  const requestedCode = cell(raw, "code") ? normalizeCode(cell(raw, "code")) : null;

  if (errors.length || !section || !domain || !skill || !difficulty || !type) {
    return { rowNumber, errors: [...new Set(errors)], warnings, flags: [], row: null };
  }

  const choices: Choice[] | null =
    type === "MCQ"
      ? (["A", "B", "C", "D"] as const)
          .map((key, i) => ({ key, text: choiceTexts[i]! }))
          .filter((c) => c.text.length > 0)
      : null;
  const answerCell = cell(raw, "correct_answer");
  const correctAnswers = type === "MCQ" ? parseMcqAnswer(answerCell) : parseSprAnswers(answerCell);

  const rationales: Partial<Record<"A" | "B" | "C" | "D", string>> = {};
  for (const k of ["A", "B", "C", "D"] as const) {
    const v = cell(raw, `rationale_${k.toLowerCase()}`);
    if (v) rationales[k] = v;
  }

  const row: NormalizedRow = {
    rowNumber,
    requestedCode,
    section,
    domain,
    skill,
    difficulty,
    type,
    passage: cell(raw, "passage") || null,
    stem,
    choices,
    correctAnswers,
    explanation: cell(raw, "explanation") || null,
    wrongChoiceRationales: type === "MCQ" && Object.keys(rationales).length ? rationales : null,
    tags: cell(raw, "tags")
      .split(/[;,]/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20),
    imageUrl,
  };

  const flags = computeContentFlags({ ...row, assetCount: imageUrl ? 1 : 0 });
  return { rowNumber, errors: [], warnings, flags, row };
}

/**
 * Give every valid row a unique code: keep the requested code when it is
 * valid and free, otherwise generate the next one for prefix + domain.
 */
export function assignCodes(
  results: RowResult[],
  existingCodes: ReadonlySet<string>,
  opts: { format: string; padding: number; codePrefix: string },
): RowResult[] {
  const used = new Set<string>(existingCodes);
  const out = results.map((r) => ({ ...r, warnings: [...r.warnings], flags: [...r.flags] }));

  // First pass: keep requested codes that are valid and unused.
  for (const r of out) {
    if (!r.row?.requestedCode) continue;
    const code = r.row.requestedCode;
    if (!CODE_PATTERN.test(code)) {
      r.warnings.push("CODE_INVALID");
      continue;
    }
    if (used.has(code)) {
      r.warnings.push("CODE_REASSIGNED");
      if (!r.flags.includes("DUPLICATE_CODE")) r.flags.push("DUPLICATE_CODE");
      continue;
    }
    used.add(code);
    r.code = code;
  }

  // Second pass: generate codes for the rest.
  for (const r of out) {
    if (!r.row || r.code) continue;
    const dom = getDomain(r.row.domain)!;
    const t = codeTemplate(opts.format, opts.codePrefix, dom.code);
    const [code] = suggestCodes([...used], t, opts.padding, 1);
    r.code = code!;
    used.add(code!);
    if (!r.row.requestedCode) r.warnings.push("CODE_GENERATED");
  }
  return out;
}

export function defaultDomainFor(section: SectionKey) {
  return domainsForSection(section)[0]!;
}
