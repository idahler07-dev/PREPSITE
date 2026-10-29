import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiUser } from "@/server/auth/session";
import { errorResponse, HttpError } from "@/server/http";

/** Order status for the "waiting for payment" page (owner only). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    const order = await db.order.findUnique({ where: { id }, select: { userId: true, status: true } });
    if (!order || order.userId !== user.id) throw new HttpError(404, "NOT_FOUND");
    return NextResponse.json({ status: order.status }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return errorResponse(e);
  }
}
