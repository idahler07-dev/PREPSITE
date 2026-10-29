/** Runs once when the Next.js server starts. Node-only code lives in instrumentation-node so it stays out of the edge bundle. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerNode } = await import("./instrumentation-node");
    await registerNode();
  }
}
