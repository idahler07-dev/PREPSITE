"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRole, STAFF_ROLES } from "@/server/auth/session";
import { audit } from "@/server/audit";
import { withdrawSource } from "@/server/questions/service";

const sourceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  owner: z.string().trim().min(2).max(120),
  notes: z.string().trim().max(2000).optional(),
  rights: z.literal("on"),
});

export type SourceFormState = { ok?: boolean; error?: string };

export async function createSourceAction(_prev: SourceFormState, form: FormData): Promise<SourceFormState> {
  const user = await requireApiRole(STAFF_ROLES);
  const parsed = sourceSchema.safeParse({
    name: form.get("name"),
    owner: form.get("owner"),
    notes: form.get("notes") || undefined,
    rights: form.get("rights"),
  });
  if (!parsed.success) return { error: parsed.error.issues.some((i) => i.path[0] === "rights") ? "RIGHTS" : "INVALID" };
  const t = await getTranslations("admin.sources");
  const source = await db.source.create({
    data: {
      name: parsed.data.name,
      owner: parsed.data.owner,
      notes: parsed.data.notes ?? null,
      rightsStatement: t("rightsStatement"),
      rightsConfirmedById: user.id,
      rightsConfirmedAt: new Date(),
    },
  });
  await audit(user.id, "source.create", "Source", source.id, { name: source.name, owner: source.owner });
  revalidatePath("/[locale]/admin/sources", "page");
  return { ok: true };
}

export async function withdrawSourceAction(sourceId: string, fileId?: string) {
  const user = await requireApiRole(STAFF_ROLES);
  const count = await withdrawSource(z.string().parse(sourceId), user, { fileId: fileId ? z.string().parse(fileId) : undefined });
  revalidatePath("/[locale]/admin", "layout");
  return { count };
}
