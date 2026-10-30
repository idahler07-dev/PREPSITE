import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export async function audit(
  actorId: string | null,
  action: string,
  entity: string,
  entityId?: string | null,
  data?: Prisma.InputJsonValue,
) {
  await db.auditLog.create({ data: { actorId, action, entity, entityId: entityId ?? null, data } });
}
