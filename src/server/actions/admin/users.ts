"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRole } from "@/server/auth/session";
import { audit } from "@/server/audit";

export async function setUserRole(userId: string, role: "STUDENT" | "EDITOR" | "ADMIN") {
  const admin = await requireApiRole(["ADMIN"]);
  const parsed = z.object({ userId: z.string(), role: z.enum(["STUDENT", "EDITOR", "ADMIN"]) }).parse({ userId, role });
  if (parsed.userId === admin.id) return { ok: false as const, error: "OWN_ROLE" };
  const before = await db.user.findUnique({ where: { id: parsed.userId }, select: { role: true } });
  if (!before) return { ok: false as const, error: "NOT_FOUND" };
  await db.user.update({ where: { id: parsed.userId }, data: { role: parsed.role } });
  await audit(admin.id, "user.role", "User", parsed.userId, { from: before.role, to: parsed.role });
  revalidatePath("/[locale]/admin/users", "page");
  return { ok: true as const };
}
