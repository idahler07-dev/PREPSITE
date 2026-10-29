import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/server/auth/session";
import { assertSameOrigin, errorResponse } from "@/server/http";
import { submitModule } from "@/server/attempts/service";

const body = z.object({ moduleId: z.string().max(40) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const { id } = await params;
    const { moduleId } = body.parse(await req.json());
    return NextResponse.json(await submitModule(id, user.id, moduleId));
  } catch (e) {
    return errorResponse(e);
  }
}
