/**
 * Digital SAT content taxonomy (public domains and skills).
 *
 * Keys are stable identifiers stored in the database. Display names live in
 * /messages/{locale}.json under `taxonomy.domains.<KEY>` and
 * `taxonomy.skills.<KEY>`.
 *
 * `weight` is the approximate share of the section's operational questions,
 * from the publicly documented test blueprint. Used by the mock test builder.
 */

export type SectionKey = "RW" | "MATH";

export interface DomainDef {
  key: string;
  /** Short code used in question codes, e.g. ALG in LC-M-ALG-0001 */
  code: string;
  section: SectionKey;
  weight: number;
  skills: readonly string[];
}

export const DOMAINS = [
  {
    key: "INFORMATION_AND_IDEAS",
    code: "INI",
    section: "RW",
    weight: 0.26,
    skills: ["CENTRAL_IDEAS_AND_DETAILS", "COMMAND_OF_EVIDENCE_TEXTUAL", "COMMAND_OF_EVIDENCE_QUANTITATIVE", "INFERENCES"],
  },
  {
    key: "CRAFT_AND_STRUCTURE",
    code: "CAS",
    section: "RW",
    weight: 0.28,
    skills: ["WORDS_IN_CONTEXT", "TEXT_STRUCTURE_AND_PURPOSE", "CROSS_TEXT_CONNECTIONS"],
  },
  {
    key: "EXPRESSION_OF_IDEAS",
    code: "EOI",
    section: "RW",
    weight: 0.2,
    skills: ["RHETORICAL_SYNTHESIS", "TRANSITIONS"],
  },
  {
    key: "STANDARD_ENGLISH_CONVENTIONS",
    code: "SEC",
    section: "RW",
    weight: 0.26,
    skills: ["BOUNDARIES", "FORM_STRUCTURE_AND_SENSE"],
  },
  {
    key: "ALGEBRA",
    code: "ALG",
    section: "MATH",
    weight: 0.35,
    skills: [
      "LINEAR_EQUATIONS_ONE_VARIABLE",
      "LINEAR_FUNCTIONS",
      "LINEAR_EQUATIONS_TWO_VARIABLES",
      "SYSTEMS_OF_LINEAR_EQUATIONS",
      "LINEAR_INEQUALITIES",
    ],
  },
  {
    key: "ADVANCED_MATH",
    code: "ADV",
    section: "MATH",
    weight: 0.35,
    skills: ["NONLINEAR_FUNCTIONS", "NONLINEAR_EQUATIONS_AND_SYSTEMS", "EQUIVALENT_EXPRESSIONS"],
  },
  {
    key: "PROBLEM_SOLVING_AND_DATA_ANALYSIS",
    code: "PSD",
    section: "MATH",
    weight: 0.15,
    skills: [
      "RATIOS_RATES_PROPORTIONS_UNITS",
      "PERCENTAGES",
      "ONE_VARIABLE_DATA",
      "TWO_VARIABLE_DATA",
      "PROBABILITY",
      "INFERENCE_FROM_SAMPLES",
      "EVALUATING_STATISTICAL_CLAIMS",
    ],
  },
  {
    key: "GEOMETRY_AND_TRIGONOMETRY",
    code: "GEO",
    section: "MATH",
    weight: 0.15,
    skills: ["AREA_AND_VOLUME", "LINES_ANGLES_TRIANGLES", "RIGHT_TRIANGLES_AND_TRIGONOMETRY", "CIRCLES"],
  },
] as const satisfies readonly DomainDef[];

export type DomainKey = (typeof DOMAINS)[number]["key"];
export type SkillKey = (typeof DOMAINS)[number]["skills"][number];

export const SECTIONS: readonly SectionKey[] = ["RW", "MATH"];

const domainByKey = new Map<string, DomainDef>(DOMAINS.map((d) => [d.key, d]));
const domainBySkill = new Map<string, DomainDef>(DOMAINS.flatMap((d) => d.skills.map((s) => [s, d] as const)));

export function getDomain(key: string): DomainDef | undefined {
  return domainByKey.get(key);
}

export function domainsForSection(section: SectionKey): DomainDef[] {
  return DOMAINS.filter((d) => d.section === section);
}

export function domainOfSkill(skill: string): DomainDef | undefined {
  return domainBySkill.get(skill);
}

export function isValidDomain(section: string, domain: string): boolean {
  return domainByKey.get(domain)?.section === section;
}

export function isValidSkill(domain: string, skill: string): boolean {
  return domainBySkill.get(skill)?.key === domain;
}

export const ALL_SKILLS: string[] = DOMAINS.flatMap((d) => [...d.skills]);

/**
 * Resolve a domain or skill typed by a person (e.g. in a spreadsheet) to its key.
 * Accepts the key itself, the short code, or the English display name in any case.
 */
export function resolveDomainKey(input: string, englishNames: Record<string, string>): string | undefined {
  const norm = normalizeLabel(input);
  if (!norm) return undefined;
  for (const d of DOMAINS) {
    if (normalizeLabel(d.key) === norm || normalizeLabel(d.code) === norm) return d.key;
    const name = englishNames[d.key];
    if (name && normalizeLabel(name) === norm) return d.key;
  }
  return undefined;
}

export function resolveSkillKey(input: string, englishNames: Record<string, string>): string | undefined {
  const norm = normalizeLabel(input);
  if (!norm) return undefined;
  for (const s of ALL_SKILLS) {
    if (normalizeLabel(s) === norm) return s;
    const name = englishNames[s];
    if (name && normalizeLabel(name) === norm) return s;
  }
  return undefined;
}

function normalizeLabel(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}
