import "server-only";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

/** Convert thrown errors into JSON responses for route handlers. */
export function errorResponse(err: unknown) {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json({ error: "VALIDATION", issues: err.issues }, { status: 400 });
  }
  console.error(err);
  return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "unknown";
}

/**
 * CSRF guard for state-changing route handlers: the Origin header (sent by all
 * modern browsers on POST/PUT/PATCH/DELETE) must match our own host.
 * Server Actions get the same check from Next.js automatically.
 */
export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) throw new HttpError(403, "BAD_ORIGIN");
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new HttpError(403, "BAD_ORIGIN");
  }
  if (originHost !== host) throw new HttpError(403, "BAD_ORIGIN");
}
