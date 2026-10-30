import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiOwner } from "@/server/auth/session";
import { assertSameOrigin, errorResponse, HttpError } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { IMAGE_TYPES, imageSize, newStorageKey, sniffImageType, storage } from "@/server/storage";

const MAX_BYTES = 5 * 1024 * 1024;

/** Upload an image for a question (figure, graph, table). Owners only. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireApiOwner();
    if (!(await rateLimit(`upload:${user.id}`, 120, 3600)).ok) throw new HttpError(429, "RATE_LIMITED");

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "NO_FILE");
    if (file.size > MAX_BYTES) throw new HttpError(413, "FILE_TOO_LARGE");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = sniffImageType(bytes);
    if (!type) throw new HttpError(415, "UNSUPPORTED_TYPE");

    const key = newStorageKey("questions", IMAGE_TYPES[type]!);
    await storage().put(key, bytes, type);
    const size = imageSize(bytes, type);
    const alt = String(form.get("alt") ?? "").slice(0, 300) || null;
    const asset = await db.questionAsset.create({
      data: { storageKey: key, mimeType: type, sizeBytes: bytes.length, width: size?.width, height: size?.height, alt, uploadedById: user.id },
    });
    return NextResponse.json({ id: asset.id, markdown: `![${alt ?? "Figure"}](asset:${asset.id})` });
  } catch (e) {
    return errorResponse(e);
  }
}
