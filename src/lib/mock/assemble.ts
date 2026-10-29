import { difficultyMix, sectionBlueprints, type Difficulty, type ModuleVariant } from "@/config/mock-blueprint";
import type { SectionKey } from "@/lib/taxonomy";

/**
 * Builds full practice tests from the published bank with fixed rules
 * (no AI): every module matches the blueprint's domain counts and difficulty
 * mix as closely as the bank allows, no question appears twice in a test,
 * and questions the student has not seen yet are preferred.
 * The same seed and inputs always give the same test.
 */

export interface MockCandidate {
  id: string;
  section: SectionKey;
  domain: string;
  difficulty: Difficulty;
}

export interface AssembledModule {
  section: SectionKey;
  moduleNumber: 1 | 2;
  variant: ModuleVariant;
  questionIds: string[];
}

export interface Shortfall {
  section: SectionKey;
  variant: ModuleVariant;
  domain: string;
  difficulty: Difficulty;
  wanted: number;
  /** Filled with a question from another difficulty or domain. */
  substituted: number;
  /** Could not be filled at all. */
  missing: number;
}

const DIFFS: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

/** Split `total` by `weights`, rounding so the parts add up (largest remainder). */
export function apportion<K extends string>(total: number, weights: Record<K, number>): Record<K, number> {
  const keys = Object.keys(weights) as K[];
  const sum = keys.reduce((s, k) => s + weights[k], 0) || 1;
  const exact = keys.map((k) => ({ k, v: (total * weights[k]) / sum }));
  const out = Object.fromEntries(exact.map(({ k, v }) => [k, Math.floor(v)])) as Record<K, number>;
  let left = total - keys.reduce((s, k) => s + out[k], 0);
  for (const { k } of [...exact].sort((a, b) => b.v - Math.floor(b.v) - (a.v - Math.floor(a.v)) || keys.indexOf(a.k) - keys.indexOf(b.k))) {
    if (left <= 0) break;
    out[k]++;
    left--;
  }
  return out;
}

/** Small seeded generator (mulberry32) so a stored seed reproduces the test. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Difficulties to try instead of `d`, nearest first. */
function nearestDifficulties(d: Difficulty): Difficulty[] {
  if (d === "MEDIUM") return ["MEDIUM", "EASY", "HARD"];
  return d === "EASY" ? ["EASY", "MEDIUM", "HARD"] : ["HARD", "MEDIUM", "EASY"];
}

export interface AssembleOptions {
  sections: SectionKey[];
  /** Module sizes per section (from test-structure). */
  moduleSize: Record<SectionKey, number>;
  seed: number;
  seen?: ReadonlySet<string>;
  /** Build only module 1 (single-module practice). */
  moduleOneOnly?: boolean;
}

export function assembleMock(candidates: readonly MockCandidate[], opts: AssembleOptions) {
  const rand = mulberry32(opts.seed);
  const seen = opts.seen ?? new Set<string>();
  // Pools per section/domain/difficulty: unseen first, each part shuffled.
  const pools = new Map<string, MockCandidate[]>();
  const key = (s: string, dom: string, dif: string) => `${s}|${dom}|${dif}`;
  const sorted = [...candidates].sort((a, b) => (a.id < b.id ? -1 : 1)); // input order must not matter
  for (const c of sorted) {
    const k = key(c.section, c.domain, c.difficulty);
    if (!pools.has(k)) pools.set(k, []);
    pools.get(k)!.push(c);
  }
  for (const [k, list] of pools) {
    pools.set(k, [...shuffle(list.filter((c) => !seen.has(c.id)), rand), ...shuffle(list.filter((c) => seen.has(c.id)), rand)]);
  }
  const used = new Set<string>();
  const take = (s: string, dom: string, dif: string): MockCandidate | null => {
    const list = pools.get(key(s, dom, dif));
    if (!list) return null;
    const i = list.findIndex((c) => !used.has(c.id));
    if (i === -1) return null;
    used.add(list[i]!.id);
    return list[i]!;
  };

  const modules: AssembledModule[] = [];
  const shortfalls: Shortfall[] = [];

  for (const section of opts.sections) {
    const bp = sectionBlueprints[section];
    const domains = Object.keys(bp.domainCounts);
    const plan: { moduleNumber: 1 | 2; variant: ModuleVariant }[] = opts.moduleOneOnly
      ? [{ moduleNumber: 1, variant: "standard" }]
      : [
          { moduleNumber: 1, variant: "standard" },
          { moduleNumber: 2, variant: "harder" },
          { moduleNumber: 2, variant: "easier" },
        ];
    // Domain counts scaled to the configured module size.
    const domainCounts = apportion(opts.moduleSize[section], bp.domainCounts);

    for (const { moduleNumber, variant } of plan) {
      const picked: MockCandidate[] = [];
      const pending: { domain: string; difficulty: Difficulty; short: Shortfall }[] = [];
      for (const domain of domains) {
        const perDiff = apportion(domainCounts[domain]!, difficultyMix[variant]);
        for (const difficulty of DIFFS) {
          const wanted = perDiff[difficulty];
          if (!wanted) continue;
          const short: Shortfall = { section, variant, domain, difficulty, wanted, substituted: 0, missing: 0 };
          for (let n = 0; n < wanted; n++) {
            const exact = take(section, domain, difficulty);
            if (exact) picked.push(exact);
            else pending.push({ domain, difficulty, short });
          }
          if (pending.some((p) => p.short === short)) shortfalls.push(short);
        }
      }
      // Fill gaps: same domain at the nearest difficulty, then other domains at the same difficulty, then anything.
      for (const p of pending) {
        let sub: MockCandidate | null = null;
        for (const d of nearestDifficulties(p.difficulty)) if (!sub) sub = take(section, p.domain, d);
        for (const d of nearestDifficulties(p.difficulty)) for (const dom of domains) if (!sub) sub = take(section, dom, d);
        if (sub) {
          picked.push(sub);
          p.short.substituted++;
        } else p.short.missing++;
      }
      // Questions are ordered roughly easy to hard, like the real test; ties keep the shuffled order.
      const rank = { EASY: 0, MEDIUM: 1, HARD: 2 };
      const ordered = picked.map((c, i) => ({ c, i })).sort((a, b) => rank[a.c.difficulty] - rank[b.c.difficulty] || a.i - b.i);
      modules.push({ section, moduleNumber, variant, questionIds: ordered.map((x) => x.c.id) });
    }
  }
  const missing = shortfalls.reduce((s, x) => s + x.missing, 0);
  return { modules, shortfalls, missing };
}
