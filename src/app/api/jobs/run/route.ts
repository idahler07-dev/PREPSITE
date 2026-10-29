import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { enqueue, JOBS, runQueuedJobs } from "@/server/jobs/queue";
import { billingDailyDue } from "@/server/billing/daily";
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
  // Daily jobs: queued by the first cron call of the day (worker mode schedules them itself).
  if (await billingDailyDue()) await enqueue(JOBS.billingDaily, {}, { singletonKey: "billing-daily" });
  const result = await runQueuedJobs(50_000);
  return NextResponse.json(result);
}

export const GET = handle;
export const POST = handle;
