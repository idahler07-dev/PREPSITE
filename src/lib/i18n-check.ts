/** Compare a locale's message keys with English. Used by scripts/check-translations.ts and tests. */

export function flattenKeys(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) return prefix ? [prefix] : [];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => flattenKeys(v, prefix ? `${prefix}.${k}` : k));
}

/** ICU placeholders like {count} or {name} used in a message. */
export function placeholders(message: string): string[] {
  const names = new Set<string>();
  for (const m of message.matchAll(/\{\s*([a-zA-Z_][\w]*)\s*(?:[,}])/g)) names.add(m[1]!);
  return [...names].sort();
}

function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);
}

export interface LocaleReport {
  locale: string;
  missing: string[];
  extra: string[];
  placeholderMismatch: string[];
}

export function compareMessages(locale: string, base: unknown, target: unknown): LocaleReport {
  const baseKeys = new Set(flattenKeys(base));
  const targetKeys = new Set(flattenKeys(target));
  const missing = [...baseKeys].filter((k) => !targetKeys.has(k)).sort();
  const extra = [...targetKeys].filter((k) => !baseKeys.has(k)).sort();
  const placeholderMismatch: string[] = [];
  for (const k of baseKeys) {
    if (!targetKeys.has(k)) continue;
    const b = getPath(base, k);
    const t = getPath(target, k);
    if (typeof b === "string" && typeof t === "string" && placeholders(b).join() !== placeholders(t).join()) {
      placeholderMismatch.push(k);
    }
  }
  return { locale, missing, extra, placeholderMismatch };
}
