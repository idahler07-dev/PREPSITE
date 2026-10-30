/** Runs once when the Next.js server starts. Node-only code lives in instrumentation-node so it stays out of the edge bundle. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerNode } = await import("./instrumentation-node");
    await registerNode();
  }
}

/** Errors in route handlers, server components and actions: structured log + optional Sentry. */
export async function onRequestError(error: unknown, request: { path: string; method: string }, context: { routerKind: string; routePath: string; routeType: string }) {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { reportError } = await import("./server/observability");
  await reportError(error, { path: request.path, method: request.method, route: context.routePath, type: context.routeType });
}
