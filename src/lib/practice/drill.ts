import { z } from "zod";
import { domainOfSkill, getDomain, isValidSkill } from "@/lib/taxonomy";
import { normalizeCode } from "@/lib/questions/codes";

export const MAX_DRILL_QUESTIONS = 50;

export const drillConfigSchema = z
  .object({
    section: z.enum(["RW", "MATH"]).nullish(),
    domains: z.array(z.string().max(60)).max(8).default([]),
    skills: z.array(z.string().max(60)).max(40).default([]),
    difficulties: z.array(z.enum(["EASY", "MEDIUM", "HARD"])).max(3).default([]),
    count: z.coerce.number().int().min(1).max(MAX_DRILL_QUESTIONS).default(10),
    codeFrom: z
      .string()
      .max(40)
      .nullish()
      .transform((v) => (v?.trim() ? normalizeCode(v) : null)),
    codeTo: z
      .string()
      .max(40)
      .nullish()
      .transform((v) => (v?.trim() ? normalizeCode(v) : null)),
    timed: z.boolean().default(false),
    feedback: z.enum(["IMMEDIATE", "END"]).default("IMMEDIATE"),
    unseenFirst: z.boolean().default(true),
    /** Exact questions, in this order (question bank). Other filters still apply, so only published questions are used. */
    questionIds: z.array(z.string().max(40)).max(MAX_DRILL_QUESTIONS).default([]),
    /** Where "Back" and the results page lead (only the question bank, so this can't be an open redirect). */
    returnTo: z
      .string()
      .max(500)
      .regex(/^\/question-bank(\?[^\s]*)?$/)
      .nullish(),
  })
  .transform((c) => {
    // Drop domains/skills that don't belong to the chosen section, and skills outside chosen domains.
    const domains = c.domains.filter((d) => {
      const dom = getDomain(d);
      return dom && (!c.section || dom.section === c.section);
    });
    const skills = c.skills.filter((s) => {
      if (domains.length) return domains.some((d) => isValidSkill(d, s));
      const dom = domainOfSkill(s);
      return !!dom && (!c.section || dom.section === c.section);
    });
    return { ...c, section: c.section ?? null, domains, skills };
  });

export type DrillConfig = z.output<typeof drillConfigSchema>;

export interface Candidate {
  id: string;
  section: "RW" | "MATH";
}

/** Deterministic PRNG (mulberry32) so a seed reproduces the same drill. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * Pick questions for a drill: unseen questions first (when asked), random
 * within each group, then ordered Reading and Writing before Math like the
 * real test.
 */
export function selectDrillQuestions(
  candidates: readonly Candidate[],
  seen: ReadonlySet<string>,
  count: number,
  opts: { unseenFirst: boolean; rand: () => number },
): Candidate[] {
  const pool = opts.unseenFirst
    ? [...shuffle(candidates.filter((c) => !seen.has(c.id)), opts.rand), ...shuffle(candidates.filter((c) => seen.has(c.id)), opts.rand)]
    : shuffle(candidates, opts.rand);
  const picked = pool.slice(0, count);
  const order = { RW: 0, MATH: 1 } as const;
  // Stable sort keeps the random order within each section.
  return picked.map((c, i) => ({ c, i })).sort((x, y) => order[x.c.section] - order[y.c.section] || x.i - y.i).map((x) => x.c);
}
