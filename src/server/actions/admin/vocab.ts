"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRole, STAFF_ROLES } from "@/server/auth/session";
import { audit } from "@/server/audit";
import { wordSchema } from "@/server/vocab/service";

type Result = { ok: true } | { ok: false; error: string };

async function run(fn: () => Promise<void>): Promise<Result> {
  try {
    await fn();
    revalidatePath("/[locale]/admin/vocab", "page");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: "VALIDATION" };
    if ((e as { code?: string }).code === "P2002") return { ok: false, error: "DUPLICATE" };
    console.error(e);
    return { ok: false, error: "INTERNAL" };
  }
}

export async function saveVocabWord(id: string | null, raw: unknown) {
  return run(async () => {
    const user = await requireApiRole(STAFF_ROLES);
    const w = wordSchema.parse(raw);
    const data = { word: w.word, partOfSpeech: w.partOfSpeech, definition: w.definition, example: w.example, translations: { uz: w.uz, ru: w.ru }, published: w.published };
    if (id) await db.vocabWord.update({ where: { id }, data });
    else await db.vocabWord.create({ data: { ...data, createdById: user.id } });
    await audit(user.id, id ? "vocab.update" : "vocab.create", "VocabWord", id, { word: w.word });
  });
}

export async function setVocabPublished(id: string, published: boolean) {
  return run(async () => {
    const user = await requireApiRole(STAFF_ROLES);
    await db.vocabWord.update({ where: { id: z.string().max(40).parse(id) }, data: { published } });
    await audit(user.id, published ? "vocab.publish" : "vocab.unpublish", "VocabWord", id, {});
  });
}
