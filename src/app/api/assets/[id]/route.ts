import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isOwner } from "@/server/auth/session";
import { storage } from "@/server/storage";

/**
 * Question images. Signed-in users only. Students see images of published
 * questions or of questions they have already been given in an attempt.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });

  const asset = await db.questionAsset.findUnique({
    where: { id },
    select: { storageKey: true, mimeType: true, question: { select: { id: true, status: true } } },
  });
  if (!asset) return new NextResponse(null, { status: 404 });

  if (!isOwner(user)) {
    const q = asset.question;
    if (!q) return new NextResponse(null, { status: 404 });
    if (q.status !== "PUBLISHED") {
      const seen = await db.response.findFirst({
        where: { questionId: q.id, module: { attempt: { userId: user.id } } },
        select: { id: true },
      });
      if (!seen) return new NextResponse(null, { status: 404 });
    }
  }

  const headers = { "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff" };
  const signed = await storage().signedUrl(asset.storageKey, { expiresInSec: 300, contentType: asset.mimeType });
  if (signed) return NextResponse.redirect(signed, { status: 302, headers });

  const body = await storage().get(asset.storageKey);
  if (!body) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(body), { headers: { ...headers, "Content-Type": asset.mimeType } });
}
