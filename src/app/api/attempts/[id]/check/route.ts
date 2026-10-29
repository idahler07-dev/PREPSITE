import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/server/auth/session";
import { assertSameOrigin, errorResponse } from "@/server/http";
import { checkResponse } from "@/server/attempts/service";

const body = z.object({ moduleId: z.string().max(40), position: z.number().int().min(0).max(200) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    const { id } = await params;
    const { moduleId, position } = body.parse(await req.json());
    return NextResponse.json(await checkResponse(id, user.id, moduleId, position));
  } catch (e) {
    return errorResponse(e);
  }
}
