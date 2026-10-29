import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { renderMarkdown } from "@/lib/markdown/render";

export type LegalPage = "terms" | "privacy" | "refunds";

/** Legal page in the user's language, falling back to English. */
export async function loadLegalPage(page: LegalPage, locale: string): Promise<{ html: string; locale: string }> {
  for (const loc of [locale, "en"]) {
    try {
      const md = await readFile(path.join(process.cwd(), "content", "legal", loc, `${page}.md`), "utf8");
      return { html: renderMarkdown(md, { math: false }), locale: loc };
    } catch {}
  }
  return { html: "", locale: "en" };
}
