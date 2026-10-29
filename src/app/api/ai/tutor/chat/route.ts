import { aiLimits } from "@/config/ai-limits";
import { requireApiUser } from "@/server/auth/session";
import { assertSameOrigin, errorResponse, HttpError } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { tutorChatStream } from "@/server/ai/tutor";

/** Follow-up question to the AI tutor about one question (NDJSON stream). */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    if (!(await rateLimit(`tutor:${user.id}`, aiLimits.tutorPerMinute, 60)).ok) throw new HttpError(429, "RATE_LIMITED");
    const stream = await tutorChatStream(user, await req.json());
    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
  } catch (e) {
    return errorResponse(e);
  }
}
