import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { sniffImageType } from "@/server/storage";

const MAX_BYTES = 5 * 1024 * 1024;

function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number) as [number, number];
    return (
      a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  return v6 === "::1" || v6 === "::" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80") || v6.startsWith("::ffff:");
}

/**
 * Download an image from an https:// URL given in an import file.
 * Refuses private/internal addresses and non-image content. Admin-only use.
 */
export async function fetchRemoteImage(url: string): Promise<{ bytes: Uint8Array; type: string } | null> {
  let current = new URL(url);
  for (let hop = 0; hop < 3; hop++) {
    if (current.protocol !== "https:") return null;
    const addrs = await lookup(current.hostname, { all: true }).catch(() => []);
    if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address))) return null;

    const res = await fetch(current, { redirect: "manual", signal: AbortSignal.timeout(10_000) }).catch(() => null);
    if (!res) return null;
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return null;
      current = new URL(loc, current);
      continue;
    }
    if (!res.ok || !res.body) return null;
    const declared = Number(res.headers.get("content-length") ?? 0);
    if (declared > MAX_BYTES) return null;

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      bytes.set(c, offset);
      offset += c.length;
    }
    const type = sniffImageType(bytes);
    return type ? { bytes, type } : null;
  }
  return null;
}
