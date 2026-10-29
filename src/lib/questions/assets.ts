/** Images are referenced from Markdown as ![alt](asset:<id>). */
const ASSET_REF = /\]\(asset:([a-z0-9]{10,40})\)/g;

export function extractAssetIds(...texts: (string | null | undefined)[]): string[] {
  const ids = new Set<string>();
  for (const t of texts) {
    if (!t) continue;
    for (const m of t.matchAll(ASSET_REF)) ids.add(m[1]!);
  }
  return [...ids];
}

export function assetUrl(id: string): string {
  return `/api/assets/${id}`;
}
