/**
 * Content Security Policy. Scripts must carry the per-request nonce
 * (Next.js adds it to its own scripts automatically); 'strict-dynamic' lets
 * those trusted scripts load others (e.g. the Telegram login widget).
 */
export function buildCsp(nonce: string, opts: { dev: boolean; storageOrigin?: string }): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(opts.dev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https://t.me",
      "https://*.telegram.org",
      "https://lh3.googleusercontent.com",
      ...(opts.storageOrigin ? [opts.storageOrigin] : []),
    ],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", ...(opts.dev ? ["ws:"] : [])],
    "frame-src": ["https://oauth.telegram.org"],
    "frame-ancestors": ["'none'"],
    "form-action": ["'self'", "https://accounts.google.com", "https://oauth.telegram.org"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
  };
  const parts = Object.entries(directives).map(([k, v]) => `${k} ${v.join(" ")}`);
  if (!opts.dev) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}

export function originOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}
