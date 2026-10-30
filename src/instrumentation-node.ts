import { startWorkers } from "./server/jobs/queue";
import "./server/jobs/handlers";

/** Node-only part of instrumentation: starts the background job worker (JOBS_MODE=worker). */
export async function registerNode() {
  if ((process.env.JOBS_MODE ?? "worker") !== "worker") return;
  if (!process.env.DATABASE_URL) return;
  await startWorkers().catch((e) => console.error("[jobs] could not start workers", e));
}
