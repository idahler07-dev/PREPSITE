import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isStaff } from "@/server/auth/session";
import { storage } from "@/server/storage";

/** Rendered image of an original PDF page (review screen). Staff only; originals are never public. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!isStaff(user)) return new NextResponse(null, { status: 404 });
  const { id } = await params;
  const page = await db.importPage.findUnique({ where: { id }, select: { imageKey: true } });
  if (!page?.imageKey) return new NextResponse(null, { status: 404 });
  const headers = { "Cache-Control": "private, max-age=600", "X-Content-Type-Options": "nosniff" };
  const signed = await storage().signedUrl(page.imageKey, { expiresInSec: 600, contentType: "image/png" });
  if (signed) return NextResponse.redirect(signed, { status: 302, headers });
  const body = await storage().get(page.imageKey);
  if (!body) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(body), { headers: { ...headers, "Content-Type": "image/png" } });
}
