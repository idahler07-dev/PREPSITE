import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole, STAFF_ROLES } from "@/server/auth/session";
import { assertSameOrigin, errorResponse, HttpError } from "@/server/http";
import { storage } from "@/server/storage";
import { enqueue, JOBS } from "@/server/jobs/queue";
import { MAX_PDF_BYTES } from "@/server/import/limits";

/** Step 2 of a PDF import: all files are uploaded — start reading them in the background. */
export async function POST(req: Request, { params }: { params: Promise<{ batchId: string }> }) {
  try {
    assertSameOrigin(req);
    await requireApiRole(STAFF_ROLES);
    const { batchId } = await params;
    const batch = await db.importBatch.findUnique({ where: { id: batchId }, include: { files: true } });
    if (!batch || batch.kind !== "PDF") throw new HttpError(404, "NOT_FOUND");
    if (batch.status !== "PENDING") return NextResponse.json({ ok: true, status: batch.status });
    for (const f of batch.files) {
      if (f.uploaded) continue;
      // Direct-to-bucket uploads: confirm the object arrived and isn't too large.
      const size = await storage().size(f.storageKey);
      if (size === null) throw new HttpError(409, "UPLOAD_INCOMPLETE");
      if (size > MAX_PDF_BYTES) throw new HttpError(413, "FILE_TOO_LARGE");
      await db.sourceFile.update({ where: { id: f.id }, data: { uploaded: true, sizeBytes: size } });
    }
    await enqueue(JOBS.pdfPrepare, { batchId });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
