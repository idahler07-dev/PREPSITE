import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runQueuedJobs } from "@/server/jobs/queue";
import "@/server/jobs/handlers";

export const maxDuration = 60;

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization") ?? "";
  if (!secret) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Runs queued background jobs for ~50 seconds. For serverless hosting
 * (JOBS_MODE=external): call it every minute from a cron with
 * "Authorization: Bearer $CRON_SECRET" (Vercel Cron sends this automatically).
 */
async function handle(req: Request) {
  if (!authorized(req)) return new NextResponse(null, { status: 401 });
  const result = await runQueuedJobs(50_000);
  return NextResponse.json(result);
}

export const GET = handle;
export const POST = handle;
