/** Only allow local paths like "/practice" (never "//evil.com" or "https://..."). */
export function safeNextPath(next: unknown): string | null {
  if (typeof next !== "string" || !next) return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  if (next.length > 300) return null;
  return next;
}
