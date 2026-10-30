"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireApiOwner } from "@/server/auth/session";
import { HttpError } from "@/server/http";
import { audit } from "@/server/audit";
import { commitBatch } from "@/server/import/spreadsheet";

export async function commitImport(batchId: string): Promise<{ ok: true; created: number } | { ok: false; error: string }> {
  const user = await requireApiOwner();
  try {
    const { created } = await commitBatch(z.string().parse(batchId), user);
    await audit(user.id, "import.commit", "ImportBatch", batchId, { created });
    revalidatePath("/manage", "layout");
    return { ok: true, created };
  } catch (e) {
    return { ok: false, error: e instanceof HttpError ? e.code : "INTERNAL" };
  }
}
