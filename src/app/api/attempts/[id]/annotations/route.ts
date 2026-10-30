import { NextResponse } from "next/server";
import { requireApiUser } from "@/server/auth/session";
import { assertSameOrigin, errorResponse, HttpError } from "@/server/http";
import { saveAnnotation } from "@/server/attempts/annotations";
import { rateLimit } from "@/server/rate-limit";

/** Save the highlights and note on one question's passage. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    if (!(await rateLimit(`annotate:${user.id}`, 120, 60)).ok) throw new HttpError(429, "RATE_LIMITED");
    const { id } = await params;
    return NextResponse.json(await saveAnnotation(id, user.id, await req.json()));
  } catch (e) {
    return errorResponse(e);
  }
}
