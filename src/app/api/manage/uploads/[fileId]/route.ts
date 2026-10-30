import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiOwner } from "@/server/auth/session";
import { assertSameOrigin, errorResponse, HttpError } from "@/server/http";
import { storage } from "@/server/storage";
import { looksLikePdf } from "@/server/pdf";
import { MAX_PDF_BYTES } from "@/server/import/limits";

/** Upload target for a PDF when storage is on the server's disk (S3/R2 uploads go straight to the bucket). */
export async function PUT(req: Request, { params }: { params: Promise<{ fileId: string }> }) {
  try {
    assertSameOrigin(req);
    await requireApiOwner();
    const { fileId } = await params;
    const file = await db.sourceFile.findUnique({ where: { id: fileId }, include: { batch: { select: { status: true } } } });
    if (!file || !file.batch || file.batch.status !== "PENDING" || file.uploaded) throw new HttpError(404, "NOT_FOUND");
    if (!req.body) throw new HttpError(400, "EMPTY_FILE");

    const reader = req.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_PDF_BYTES) {
        await reader.cancel();
        throw new HttpError(413, "FILE_TOO_LARGE");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      bytes.set(c, offset);
      offset += c.length;
    }
    if (!looksLikePdf(bytes)) throw new HttpError(415, "UNSUPPORTED_FILE");
    await storage().put(file.storageKey, bytes, "application/pdf");
    await db.sourceFile.update({ where: { id: fileId }, data: { uploaded: true, sizeBytes: total } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
