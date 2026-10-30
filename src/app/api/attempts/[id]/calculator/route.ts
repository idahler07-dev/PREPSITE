import { NextResponse } from "next/server";
import { requireApiUser } from "@/server/auth/session";
import { assertSameOrigin, errorResponse, HttpError } from "@/server/http";
import { saveCalculatorState } from "@/server/attempts/service";
import { rateLimit } from "@/server/rate-limit";

/** Save the Desmos calculator state for an attempt in progress (debounced by the client). */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    if (!(await rateLimit(`calc:${user.id}`, 60, 60)).ok) throw new HttpError(429, "RATE_LIMITED");
    const { id } = await params;
    return NextResponse.json(await saveCalculatorState(id, user.id, await req.json()));
  } catch (e) {
    return errorResponse(e);
  }
}
