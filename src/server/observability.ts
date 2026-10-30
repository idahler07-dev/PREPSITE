import "server-only";

/** One JSON line per event, easy to search in any log viewer. */
export function logEvent(level: "info" | "warn" | "error", message: string, data: Record<string, unknown> = {}) {
  const line = JSON.stringify({ level, time: new Date().toISOString(), message, ...data });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

/**
 * Send an error to Sentry when SENTRY_DSN is set, using Sentry's envelope
 * endpoint directly (no SDK). Never throws.
 */
export async function reportError(error: unknown, context: Record<string, unknown> = {}) {
  const err = error instanceof Error ? error : new Error(String(error));
  logEvent("error", err.message, { ...context, stack: err.stack?.split("\n").slice(0, 8).join("\n") });
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  try {
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/^\//, "");
    const eventId = crypto.randomUUID().replace(/-/g, "");
    const event = {
      event_id: eventId,
      timestamp: Date.now() / 1000,
      platform: "node",
      level: "error",
      environment: process.env.NODE_ENV,
      exception: { values: [{ type: err.name, value: err.message, stacktrace: { frames: (err.stack ?? "").split("\n").slice(1, 20).reverse().map((l) => ({ function: l.trim() })) } }] },
      tags: Object.fromEntries(Object.entries(context).map(([k, v]) => [k, String(v).slice(0, 200)])),
    };
    const body = [JSON.stringify({ event_id: eventId, dsn }), JSON.stringify({ type: "event" }), JSON.stringify(event)].join("\n");
    await fetch(`${u.protocol}//${u.host}/api/${projectId}/envelope/`, { method: "POST", body, headers: { "Content-Type": "application/x-sentry-envelope" }, signal: AbortSignal.timeout(5000) });
  } catch {
    // Reporting must never break the request.
  }
}
