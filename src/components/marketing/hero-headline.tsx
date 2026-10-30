import type { CSSProperties, ReactNode } from "react";
import { emphasis } from "@/components/motion/emphasis-tags";

type Tag = keyof typeof emphasis;
type Seg = { text: string; tag?: Tag };

/** Split "Your SAT score, <i>planned</i> and <hl>proven</hl>." into plain and tagged segments. */
function parse(raw: string): Seg[] {
  const out: Seg[] = [];
  const re = /<(i|hl|b|grad)>(.*?)<\/\1>/gs;
  let last = 0;
  for (const m of raw.matchAll(re)) {
    if (m.index! > last) out.push({ text: raw.slice(last, m.index) });
    out.push({ text: m[2]!, tag: m[1] as Tag });
    last = m.index! + m[0].length;
  }
  if (last < raw.length) out.push({ text: raw.slice(last) });
  return out;
}

/**
 * Hero headline: words fade and rise in one by one (40ms stagger) on first
 * load; emphasized words (en.json tags) arrive last, then the underline
 * draws in. CSS animation (server-rendered, so the headline paints without
 * waiting for JavaScript). Screen readers get the plain sentence once.
 */
export function HeroHeadline({ raw, className }: { raw: string; className?: string }) {
  const segs = parse(raw);
  const plainCount = segs.filter((s) => !s.tag).reduce((n, s) => n + s.text.split(/\s+/).filter(Boolean).length, 0);
  let plainIndex = 0;
  let emphIndex = 0;
  const plain = segs.map((s) => s.text).join("").replace(/\s+/g, " ").trim();

  const rise = (key: string, i: number, child: ReactNode) => (
    <span key={key} className="hero-word" style={{ "--i": i } as CSSProperties}>
      {child}
    </span>
  );

  return (
    <h1 className={className}>
      <span className="sr-only">{plain}</span>
      <span aria-hidden>
        {segs.map((s, si) => {
          if (s.tag) {
            const i = plainCount + 2 + emphIndex++;
            return rise(`e${si}`, i, emphasis[s.tag](s.text));
          }
          // Keep spaces between words so lines still wrap naturally.
          return s.text.split(/(\s+)/).map((w, wi) => (/^\s+$/.test(w) || !w ? w : rise(`p${si}-${wi}`, plainIndex++, w)));
        })}
      </span>
    </h1>
  );
}
