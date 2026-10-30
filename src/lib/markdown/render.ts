import { unified, type Plugin } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema, type Options as SanitizeSchema } from "rehype-sanitize";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import type { Element, ElementContent, Root as HastRoot } from "hast";
import type { Root as MdastRoot, RootContent, PhrasingContent, Text } from "mdast";

/**
 * Markdown → safe HTML. Used for question content (with LaTeX math) and for
 * pages such as guides and legal text. Raw HTML in the source is never
 * rendered; output is sanitized before KaTeX adds its own markup.
 *
 * Isomorphic: runs on the server for students and in the browser for the
 * editor's live preview.
 */

const UNCERTAIN = /\[\[\?([\s\S]*?)\]\]/g;

/** [[?text]] (text the importer was unsure about) → <mark class="uncertain">text</mark> */
const remarkUncertain: Plugin<[], MdastRoot> = () => (tree) => {
  const walk = (node: { children?: RootContent[] }) => {
    if (!node.children) return;
    const out: RootContent[] = [];
    for (const child of node.children) {
      if (child.type === "text" && child.value.includes("[[?")) {
        let last = 0;
        for (const m of child.value.matchAll(UNCERTAIN)) {
          if (m.index! > last) out.push({ type: "text", value: child.value.slice(last, m.index) });
          const mark = {
            type: "emphasis",
            children: [{ type: "text", value: m[1] ?? "" } as Text],
            data: { hName: "mark", hProperties: { className: ["uncertain"] } },
          } as unknown as PhrasingContent;
          out.push(mark);
          last = m.index! + m[0].length;
        }
        if (last < child.value.length) out.push({ type: "text", value: child.value.slice(last) });
      } else {
        walk(child as { children?: RootContent[] });
        out.push(child);
      }
    }
    node.children = out;
  };
  walk(tree);
};

/** Images: only our private assets (asset:<id>) are shown; anything else becomes its alt text. */
const rehypeAssets: Plugin<[], HastRoot> = () => (tree) => {
  const walk = (node: { children?: ElementContent[] }) => {
    if (!node.children) return;
    node.children = node.children.map((child) => {
      if (child.type !== "element") return child;
      if (child.tagName === "img") {
        const src = String(child.properties?.src ?? "");
        const match = /^asset:([a-z0-9]{10,40})$/.exec(src);
        if (!match) return { type: "text", value: String(child.properties?.alt ?? "") };
        child.properties = {
          src: `/api/assets/${match[1]}`,
          alt: String(child.properties?.alt ?? ""),
          loading: "lazy",
          decoding: "async",
        };
        return child;
      }
      if (child.tagName === "a") {
        const href = String(child.properties?.href ?? "");
        if (/^https?:\/\//.test(href)) child.properties = { ...child.properties, target: "_blank", rel: ["noopener", "noreferrer"] };
      }
      walk(child as Element);
      return child;
    });
  };
  walk(tree as unknown as { children?: ElementContent[] });
};

const schema: SanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "mark"],
  // Keep ids/classes predictable (no "user-content-" clobber prefixes needed: we allow no ids).
  clobberPrefix: "md-",
  attributes: {
    ...defaultSchema.attributes,
    code: [["className", "language-math", "math-inline", "math-display"]],
    mark: [["className", "uncertain"]],
    img: ["src", "alt", "title"],
    th: ["align"],
    td: ["align"],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: ["http", "https", "asset"],
  },
};

function buildProcessor(math: boolean) {
  const p = unified().use(remarkParse).use(remarkGfm);
  if (math) p.use(remarkMath);
  return p
    .use(remarkUncertain)
    .use(remarkRehype)
    .use(rehypeSanitize, schema)
    .use(rehypeAssets)
    .use(rehypeKatex, { strict: "ignore", trust: false, output: "htmlAndMathml" })
    .use(rehypeStringify);
}

const withMath = buildProcessor(true);
const withoutMath = buildProcessor(false);

/** `$$x$$` alone on a line is display math (remark-math only treats multi-line $$ blocks as display). */
function normalizeDisplayMath(md: string): string {
  return md.replace(/^[ \t]*\$\$([^\n]+?)\$\$[ \t]*$/gm, (_m, tex: string) => `$$\n${tex.trim()}\n$$`);
}

/**
 * Render Markdown to sanitized HTML.
 * With math on, $…$ is inline math and $$…$$ display math; write a literal
 * dollar sign as \$ (e.g. "costs \$5").
 */
export function renderMarkdown(markdown: string | null | undefined, opts: { math?: boolean } = {}): string {
  if (!markdown) return "";
  if (opts.math === false) return String(withoutMath.processSync(markdown));
  return String(withMath.processSync(normalizeDisplayMath(markdown)));
}
