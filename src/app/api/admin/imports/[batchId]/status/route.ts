import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole, STAFF_ROLES } from "@/server/auth/session";
import { errorResponse, HttpError } from "@/server/http";

/** Progress of a PDF import (polled by the progress bar). */
export async function GET(_req: Request, { params }: { params: Promise<{ batchId: string }> }) {
  try {
    await requireApiRole(STAFF_ROLES);
    const { batchId } = await params;
    const batch = await db.importBatch.findUnique({ where: { id: batchId }, select: { status: true, totalItems: true, error: true } });
    if (!batch) throw new HttpError(404, "NOT_FOUND");
    const counts = await db.importPage.groupBy({ by: ["status"], where: { batchId }, _count: true });
    const by = Object.fromEntries(counts.map((c) => [c.status, c._count])) as Record<string, number>;
    return NextResponse.json(
      {
        status: batch.status,
        total: batch.totalItems,
        done: (by.DONE ?? 0) + (by.FAILED ?? 0),
        failed: by.FAILED ?? 0,
        error: batch.error,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
