import "server-only";
import type { PgBoss, Job } from "pg-boss";

/**
 * Background jobs on pg-boss (PostgreSQL). JOBS_MODE chooses how they run:
 *   worker   (default) jobs are queued and a worker inside the Next.js server process runs them — VPS / `next start`.
 *   external jobs are queued only; POST /api/jobs/run (called by a cron, e.g. Vercel Cron) runs them — serverless.
 *   inline   jobs run immediately in the caller — tests and quick local experiments.
 */
export type JobsMode = "worker" | "external" | "inline";

export const JOBS = {
  pdfPrepare: "pdf-import-prepare",
  pdfPage: "pdf-import-page",
  pdfFinalize: "pdf-import-finalize",
  aiDraft: "ai-draft-questions",
} as const;

export type JobName = (typeof JOBS)[keyof typeof JOBS];

/** Thrown by a handler to ask for another attempt later (the queue's retry policy applies). */
export class RetryableJobError extends Error {}

export interface JobContext {
  retryCount: number;
  retryLimit: number;
}

type Handler = (data: Record<string, unknown>, ctx: JobContext) => Promise<void>;

const QUEUES: Record<JobName, { retryLimit: number; retryDelay: number; expireInSeconds: number; policy?: string; concurrency: number }> = {
  [JOBS.pdfPrepare]: { retryLimit: 1, retryDelay: 30, expireInSeconds: 600, concurrency: 1 },
  // AI page reads can be slow; several pages are read in parallel.
  [JOBS.pdfPage]: { retryLimit: 2, retryDelay: 20, expireInSeconds: 900, concurrency: 3 },
  [JOBS.pdfFinalize]: { retryLimit: 1, retryDelay: 30, expireInSeconds: 1800, policy: "exclusive", concurrency: 1 },
  // A batch records its own failure; it is never retried automatically (that would draft twice).
  [JOBS.aiDraft]: { retryLimit: 0, retryDelay: 60, expireInSeconds: 3600, concurrency: 1 },
};

const handlers = new Map<JobName, Handler>();

export function registerHandler(name: JobName, handler: Handler) {
  handlers.set(name, handler);
}

export function jobsMode(): JobsMode {
  const m = process.env.JOBS_MODE;
  return m === "external" || m === "inline" ? m : "worker";
}

async function ensureHandlers() {
  if (handlers.size === 0) await import("./handlers");
}

const g = globalThis as unknown as { __pgboss?: Promise<PgBoss>; __workersStarted?: boolean };

export function getBoss(): Promise<PgBoss> {
  if (!g.__pgboss) {
    g.__pgboss = (async () => {
      const { PgBoss } = await import("pg-boss");
      const boss = new PgBoss({ connectionString: process.env.DATABASE_URL!, schema: "pgboss" });
      boss.on("error", (e: unknown) => console.error("[jobs]", e));
      await boss.start();
      for (const [name, q] of Object.entries(QUEUES)) {
        const existing = await boss.getQueue(name);
        if (!existing) {
          await boss.createQueue(name, {
            retryLimit: q.retryLimit,
            retryDelay: q.retryDelay,
            retryBackoff: true,
            expireInSeconds: q.expireInSeconds,
            ...(q.policy ? { policy: q.policy } : {}),
          });
        }
      }
      return boss;
    })();
    g.__pgboss.catch(() => {
      g.__pgboss = undefined;
    });
  }
  return g.__pgboss;
}

async function runHandler(name: JobName, data: Record<string, unknown>, ctx: JobContext) {
  await ensureHandlers();
  const handler = handlers.get(name);
  if (!handler) throw new Error(`No handler for job ${name}`);
  await handler(data, ctx);
}

/** Queue a job (or run it now in inline mode). */
export async function enqueue(name: JobName, data: Record<string, unknown>, opts: { singletonKey?: string } = {}) {
  if (jobsMode() === "inline") {
    const limit = QUEUES[name].retryLimit;
    for (let attempt = 0; ; attempt++) {
      try {
        await runHandler(name, data, { retryCount: attempt, retryLimit: limit });
        return;
      } catch (e) {
        if (!(e instanceof RetryableJobError) || attempt >= limit) throw e;
      }
    }
  }
  const boss = await getBoss();
  await boss.send(name, data, opts.singletonKey ? { singletonKey: opts.singletonKey } : undefined);
}

async function processJob(name: JobName, job: Job<Record<string, unknown>>) {
  await runHandler(name, job.data, { retryCount: job.retryCount, retryLimit: QUEUES[name].retryLimit });
}

/** Start in-process workers (JOBS_MODE=worker). Safe to call more than once. */
export async function startWorkers() {
  if (g.__workersStarted || jobsMode() !== "worker") return;
  g.__workersStarted = true;
  const boss = await getBoss();
  for (const [name, q] of Object.entries(QUEUES) as [JobName, (typeof QUEUES)[JobName]][]) {
    await boss.work<Record<string, unknown>>(name, { batchSize: 1, localConcurrency: q.concurrency, pollingIntervalSeconds: 2 }, async (jobs) => {
      for (const job of jobs) await processJob(name, job);
    });
  }
  console.info("[jobs] workers started");
}

/** Process queued jobs until the time budget is used (cron endpoint for serverless hosting). */
export async function runQueuedJobs(budgetMs: number): Promise<{ processed: number; failed: number }> {
  const boss = await getBoss();
  const deadline = Date.now() + budgetMs;
  let processed = 0;
  let failed = 0;
  // Finalize first so finished imports appear quickly, then pages, then new uploads.
  const order: JobName[] = [JOBS.pdfFinalize, JOBS.pdfPage, JOBS.pdfPrepare, JOBS.aiDraft];
  while (Date.now() < deadline) {
    let didWork = false;
    for (const name of order) {
      if (Date.now() >= deadline) break;
      const [job] = await boss.fetch<Record<string, unknown>>(name, { batchSize: 1 });
      if (!job) continue;
      didWork = true;
      try {
        await processJob(name, job);
        await boss.complete(name, job.id);
        processed++;
      } catch (e) {
        await boss.fail(name, job.id, { message: e instanceof Error ? e.message : String(e) });
        failed++;
      }
    }
    if (!didWork) break;
  }
  return { processed, failed };
}
