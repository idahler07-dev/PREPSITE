import { NextResponse } from "next/server";
import { requireApiUser } from "@/server/auth/session";
import { assertSameOrigin, errorResponse } from "@/server/http";
import { saveResponses } from "@/server/attempts/service";

/** Autosave: answers, flags, cross-outs and time per question (batched). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const { id } = await params;
    return NextResponse.json(await saveResponses(id, user.id, await req.json()));
  } catch (e) {
    return errorResponse(e);
  }
}
