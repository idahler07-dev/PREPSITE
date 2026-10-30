"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { signOut } from "@/lib/auth";
import { goalSchema, daysUntil } from "@/lib/goals";
import { requireApiUser } from "@/server/auth/session";
import { audit } from "@/server/audit";

export type FormState = { ok?: boolean; errors?: Record<string, string> };

function parseGoal(form: FormData) {
  const raw = {
    testDate: String(form.get("testDate") ?? ""),
    targetScore: String(form.get("targetScore") ?? ""),
    currentScore: String(form.get("currentScore") ?? ""),
  };
  const parsed = goalSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0]);
      errors[field] = field === "testDate" ? "date" : "score";
    }
    return { errors };
  }
  if (parsed.data.testDate && daysUntil(parsed.data.testDate) < 0) return { errors: { testDate: "date" } };
  return { data: parsed.data };
}

export async function saveGoal(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireApiUser();
  const { data, errors } = parseGoal(form);
  if (errors) return { errors };
  await db.user.update({
    where: { id: user.id },
    data: { ...data, onboardedAt: user.onboardedAt ?? new Date() },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function skipOnboarding() {
  const user = await requireApiUser();
  if (!user.onboardedAt) await db.user.update({ where: { id: user.id }, data: { onboardedAt: new Date() } });
}

const nameSchema = z.string().trim().max(80);

export async function saveName(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireApiUser();
  const parsed = nameSchema.safeParse(form.get("name") ?? "");
  if (!parsed.success) return { errors: { name: "invalid" } };
  await db.user.update({ where: { id: user.id }, data: { name: parsed.data || null } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteAccount(confirmation: string) {
  const user = await requireApiUser();
  if (confirmation.trim() !== "DELETE") return { error: "CONFIRMATION" };
  await audit(null, "user.delete", "User", user.id, {});
  // Cascades remove accounts, attempts, modules and responses. Reports stay, anonymized.
  await db.user.delete({ where: { id: user.id } });
  await signOut({ redirectTo: "/" });
}
