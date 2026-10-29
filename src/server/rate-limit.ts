import "server-only";
import { db } from "@/lib/db";

export interface RateLimitResult {
  ok: boolean;
  count: number;
  limit: number;
  resetAt: Date;
}

/**
 * Fixed-window rate limit stored in Postgres, so it holds across server
 * instances. `key` should include the action and the subject, e.g.
 * "magic-link:ip:1.2.3.4".
 */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<RateLimitResult> {
  const rows = await db.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, now() + make_interval(secs => ${windowSec}))
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."resetAt" <= now() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" <= now() THEN now() + make_interval(secs => ${windowSec}) ELSE "RateLimit"."resetAt" END
    RETURNING "count", "resetAt"`;
  const row = rows[0]!;
  // Occasionally clear expired windows so the table stays small.
  if (Math.random() < 0.01) {
    await db.rateLimit.deleteMany({ where: { resetAt: { lt: new Date(Date.now() - 3600_000) } } });
  }
  return { ok: row.count <= limit, count: row.count, limit, resetAt: row.resetAt };
}
