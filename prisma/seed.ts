/**
 * Development seed: 20 sample questions per section, all published and
 * marked isSample = true. Safe to run more than once.
 * Remove them before launch: pnpm samples:remove
 */
import { scriptClient } from "../scripts/db";
import { getDomain } from "../src/lib/taxonomy";
import { computeContentFlags } from "../src/lib/questions/flags";
import { fingerprintText } from "../src/lib/questions/fingerprint";
import { SAMPLE_MATH, SAMPLE_RW, type SampleQuestion } from "./seed-data";
import { STARTER_VOCAB } from "./vocab-data";

const db = scriptClient();

async function seedSamples() {
  const counters = new Map<string, number>();
  let created = 0;
  let updated = 0;
  for (const s of [...SAMPLE_RW, ...SAMPLE_MATH] as SampleQuestion[]) {
    const dom = getDomain(s.domain);
    if (!dom || !(dom.skills as readonly string[]).includes(s.skill)) throw new Error(`Bad taxonomy in sample: ${s.domain}/${s.skill}`);
    const n = (counters.get(dom.code) ?? 0) + 1;
    counters.set(dom.code, n);
    const code = `SAMPLE-${dom.code}-${String(n).padStart(4, "0")}`;
    const choices = s.choices ? (["A", "B", "C", "D"] as const).map((key, i) => ({ key, text: s.choices![i]! })) : null;
    const flags = computeContentFlags({ type: s.type, passage: s.passage, stem: s.stem, choices, correctAnswers: s.answer });
    if (flags.length) throw new Error(`Sample ${code} has flags: ${flags.join(", ")}`);
    const data = {
      section: s.section,
      domain: s.domain,
      skill: s.skill,
      difficulty: s.difficulty,
      type: s.type,
      passage: s.passage ?? null,
      stem: s.stem,
      choices: choices ?? undefined,
      correctAnswers: s.answer,
      explanation: s.explanation,
      wrongChoiceRationales: s.rationales ?? undefined,
      tags: ["sample"],
      status: "PUBLISHED" as const,
      origin: "MANUAL" as const,
      isSample: true,
      flags: [],
      fingerprint: fingerprintText([s.passage, s.stem, ...(s.choices ?? [])]),
      publishedAt: new Date(),
    };
    const existing = await db.question.findUnique({ where: { code }, select: { id: true } });
    if (existing) {
      await db.question.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      const q = await db.question.create({ data: { code, ...data } });
      await db.questionVersion.create({ data: { questionId: q.id, version: 1, snapshot: { code, ...data, publishedAt: undefined }, changeNote: "sample seed" } });
      created++;
    }
  }
  console.log(`Sample questions: ${created} created, ${updated} updated (${SAMPLE_RW.length} R&W, ${SAMPLE_MATH.length} Math).`);
  console.log("These are development samples. Remove them before launch with: pnpm samples:remove");
}

/** Starter vocabulary (real content, kept at launch). Existing words are left as edited. */
async function seedVocab() {
  let created = 0;
  for (const v of STARTER_VOCAB) {
    const r = await db.vocabWord.upsert({
      where: { word: v.word },
      create: { word: v.word, partOfSpeech: v.partOfSpeech, definition: v.definition, example: v.example, translations: { uz: v.uz, ru: v.ru } },
      update: {},
    });
    if (r.createdAt.getTime() > Date.now() - 60_000) created++;
  }
  console.log(`Vocabulary: ${created} new words (${STARTER_VOCAB.length} in the starter set).`);
}

seedSamples()
  .then(seedVocab)
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
