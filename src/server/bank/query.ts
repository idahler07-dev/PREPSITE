import "server-only";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { DOMAINS, isValidSkill } from "@/lib/taxonomy";

/**
 * The question bank: every published question with the student's own status
 * (unattempted / correct / incorrect, from their latest graded answer, and
 * flagged), filtered, sorted and paginated in SQL. The bank is the one place
 * students see question codes.
 */

export const BANK_PAGE_SIZE = 25;
/** "Practice these" / "Practice my mistakes" start a drill with at most this many questions. */
export const BANK_PRACTICE_MAX = 20;

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
export const BANK_STATUSES = ["unattempted", "correct", "incorrect", "flagged"] as const;
export const BANK_SORTS = ["difficulty", "newest", "missed"] as const;

export const bankFiltersSchema = z
  .object({
    section: z.enum(["RW", "MATH"]).catch("RW"),
    domain: z.string().max(60).optional().catch(undefined),
    skill: z.string().max(60).optional().catch(undefined),
    difficulty: z.enum(DIFFICULTIES).optional().catch(undefined),
    status: z.enum(BANK_STATUSES).optional().catch(undefined),
    q: z
      .string()
      .max(80)
      .optional()
      .catch(undefined)
      .transform((v) => v?.trim() || undefined),
    sort: z.enum(BANK_SORTS).catch("difficulty"),
    page: z.coerce.number().int().min(1).max(10_000).catch(1),
  })
  .transform((f) => {
    // Keep domain and skill only when they belong to the section (and to each other).
    const domain = f.domain && DOMAINS.some((d) => d.key === f.domain && d.section === f.section) ? f.domain : undefined;
    const skill = f.skill && (domain ? isValidSkill(domain, f.skill) : DOMAINS.some((d) => d.section === f.section && isValidSkill(d.key, f.skill!))) ? f.skill : undefined;
    return { ...f, domain, skill };
  });

export type BankFilters = z.output<typeof bankFiltersSchema>;

export interface BankRow {
  id: string;
  code: string;
  domain: string;
  skill: string;
  difficulty: (typeof DIFFICULTIES)[number];
  type: "MCQ" | "SPR";
  preview: string;
  status: "unattempted" | "correct" | "incorrect";
  flagged: boolean;
  lastTimeMs: number | null;
}

/** The student's latest graded answer per question, and the questions they flagged or bookmarked. */
function personal(userId: string) {
  return Prisma.sql`
    last AS (
      SELECT DISTINCT ON (r."questionId") r."questionId", r."isCorrect", r."timeSpentMs"
      FROM "Response" r
      JOIN "AttemptModule" m ON m.id = r."moduleId"
      JOIN "Attempt" a ON a.id = m."attemptId"
      WHERE a."userId" = ${userId} AND r."gradedAt" IS NOT NULL AND r.answer IS NOT NULL
      ORDER BY r."questionId", r."gradedAt" DESC
    ),
    flags AS (
      SELECT r."questionId"
      FROM "Response" r
      JOIN "AttemptModule" m ON m.id = r."moduleId"
      JOIN "Attempt" a ON a.id = m."attemptId"
      WHERE a."userId" = ${userId} AND r.flagged
      UNION
      SELECT n."questionId" FROM "QuestionNote" n WHERE n."userId" = ${userId} AND n.bookmarked
    )`;
}

/** Share of answers that were wrong, across all students (for "most missed"). */
const MISS = Prisma.sql`
    miss AS (
      SELECT r."questionId", AVG(CASE WHEN r."isCorrect" THEN 0 ELSE 1 END)::float AS rate, COUNT(*) AS n
      FROM "Response" r
      WHERE r."gradedAt" IS NOT NULL AND r.answer IS NOT NULL
      GROUP BY r."questionId"
    )`;

function where(f: BankFilters, opts: { ignoreDifficulty?: boolean; status?: BankFilters["status"] } = {}) {
  const parts: Prisma.Sql[] = [Prisma.sql`q.status::text = 'PUBLISHED'`, Prisma.sql`q.section::text = ${f.section}`];
  if (f.domain) parts.push(Prisma.sql`q.domain = ${f.domain}`);
  if (f.skill) parts.push(Prisma.sql`q.skill = ${f.skill}`);
  if (f.difficulty && !opts.ignoreDifficulty) parts.push(Prisma.sql`q.difficulty::text = ${f.difficulty}`);
  if (f.q) {
    const like = `%${f.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    parts.push(Prisma.sql`(q.code ILIKE ${like} OR q.stem ILIKE ${like} OR q.passage ILIKE ${like})`);
  }
  const status = opts.status === undefined ? f.status : opts.status;
  if (status === "unattempted") parts.push(Prisma.sql`last."questionId" IS NULL`);
  if (status === "correct") parts.push(Prisma.sql`last."isCorrect" = true`);
  if (status === "incorrect") parts.push(Prisma.sql`last."isCorrect" = false`);
  if (status === "flagged") parts.push(Prisma.sql`flags."questionId" IS NOT NULL`);
  return Prisma.join(parts, " AND ");
}

function orderBy(sort: BankFilters["sort"]) {
  switch (sort) {
    case "newest":
      return Prisma.sql`COALESCE(q."publishedAt", q."createdAt") DESC, q.code`;
    case "missed":
      return Prisma.sql`miss.rate DESC NULLS LAST, miss.n DESC NULLS LAST, q.code`;
    default:
      return Prisma.sql`CASE q.difficulty::text WHEN 'EASY' THEN 0 WHEN 'MEDIUM' THEN 1 ELSE 2 END, q.code`;
  }
}

const FROM = Prisma.sql`
  FROM "Question" q
  LEFT JOIN last ON last."questionId" = q.id
  LEFT JOIN (SELECT DISTINCT "questionId" FROM flags) flags ON flags."questionId" = q.id`;

/** Plain-text preview of a markdown stem: no images, tables or markup; math shown as typed. */
export function stemPreview(md: string, max = 140): string {
  const text = md
    // Escaped dollar signs are money, not math.
    .replace(/\\\$/g, "\u0000")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/^\s*\|.*\|\s*$/gm, " ")
    .replace(/\$\$?([^$]+)\$\$?/g, (_, m: string) => m.replace(/\\(frac|dfrac)\{([^}]*)\}\{([^}]*)\}/g, "$2/$3").replace(/\\[a-zA-Z]+/g, " ").replace(/[{}]/g, ""))
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\u0000/g, "$")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export async function getBankPage(userId: string, f: BankFilters) {
  const offset = (f.page - 1) * BANK_PAGE_SIZE;
  const withMiss = f.sort === "missed";
  const ctes = withMiss ? Prisma.sql`WITH ${personal(userId)}, ${MISS}` : Prisma.sql`WITH ${personal(userId)}`;
  const missJoin = withMiss ? Prisma.sql`LEFT JOIN miss ON miss."questionId" = q.id` : Prisma.empty;

  const [rows, total] = await Promise.all([
    db.$queryRaw<
      { id: string; code: string; domain: string; skill: string; difficulty: BankRow["difficulty"]; type: BankRow["type"]; stem: string; isCorrect: boolean | null; timeSpentMs: number | null; attempted: boolean; flagged: boolean }[]
    >`${ctes}
      SELECT q.id, q.code, q.domain, q.skill, q.difficulty::text AS difficulty, q.type::text AS type, q.stem,
             last."isCorrect", last."timeSpentMs", (last."questionId" IS NOT NULL) AS attempted, (flags."questionId" IS NOT NULL) AS flagged
      ${FROM} ${missJoin}
      WHERE ${where(f)}
      ORDER BY ${orderBy(f.sort)}
      LIMIT ${BANK_PAGE_SIZE} OFFSET ${offset}`,
    db.$queryRaw<{ n: bigint }[]>`WITH ${personal(userId)} SELECT COUNT(*) AS n ${FROM} WHERE ${where(f)}`.then((r) => Number(r[0]?.n ?? 0)),
  ]);

  return {
    total,
    pages: Math.max(1, Math.ceil(total / BANK_PAGE_SIZE)),
    rows: rows.map(
      (r): BankRow => ({
        id: r.id,
        code: r.code,
        domain: r.domain,
        skill: r.skill,
        difficulty: r.difficulty,
        type: r.type,
        preview: stemPreview(r.stem),
        status: !r.attempted ? "unattempted" : r.isCorrect ? "correct" : "incorrect",
        flagged: r.flagged,
        lastTimeMs: r.timeSpentMs,
      }),
    ),
  };
}

/** How many questions each difficulty has with the other filters applied (for the difficulty chips). */
export async function getDifficultyCounts(userId: string, f: BankFilters): Promise<Record<(typeof DIFFICULTIES)[number], number>> {
  const rows = await db.$queryRaw<{ difficulty: string; n: bigint }[]>`WITH ${personal(userId)}
    SELECT q.difficulty::text AS difficulty, COUNT(*) AS n ${FROM} WHERE ${where(f, { ignoreDifficulty: true })} GROUP BY 1`;
  const counts = { EASY: 0, MEDIUM: 0, HARD: 0 };
  for (const r of rows) counts[r.difficulty as keyof typeof counts] = Number(r.n);
  return counts;
}

/** Per-domain progress for the section: questions answered at least once and answered correctly last time. */
export async function getDomainProgress(userId: string, section: "RW" | "MATH") {
  const rows = await db.$queryRaw<{ domain: string; total: bigint; attempted: bigint; correct: bigint }[]>`WITH ${personal(userId)}
    SELECT q.domain, COUNT(*) AS total, COUNT(last."questionId") AS attempted, COUNT(*) FILTER (WHERE last."isCorrect") AS correct
    ${FROM}
    WHERE q.status::text = 'PUBLISHED' AND q.section::text = ${section}
    GROUP BY q.domain`;
  return DOMAINS.filter((d) => d.section === section).map((d) => {
    const r = rows.find((x) => x.domain === d.key);
    return { domain: d.key, total: Number(r?.total ?? 0), attempted: Number(r?.attempted ?? 0), correct: Number(r?.correct ?? 0) };
  });
}

/** Ids for "Practice these" (the current filters) or "Practice my mistakes" (same filters, incorrect only), in bank order. */
export async function getBankPracticeIds(userId: string, f: BankFilters, mode: "these" | "mistakes"): Promise<string[]> {
  const withMiss = f.sort === "missed";
  const ctes = withMiss ? Prisma.sql`WITH ${personal(userId)}, ${MISS}` : Prisma.sql`WITH ${personal(userId)}`;
  const missJoin = withMiss ? Prisma.sql`LEFT JOIN miss ON miss."questionId" = q.id` : Prisma.empty;
  const rows = await db.$queryRaw<{ id: string }[]>`${ctes}
    SELECT q.id ${FROM} ${missJoin}
    WHERE ${where(f, mode === "mistakes" ? { status: "incorrect" } : {})}
    ORDER BY ${orderBy(f.sort)}
    LIMIT ${BANK_PRACTICE_MAX} OFFSET ${mode === "these" ? (f.page - 1) * BANK_PAGE_SIZE : 0}`;
  return rows.map((r) => r.id);
}
