import type { ReactNode } from "react";
import { Highlight } from "./emphasis";

/**
 * Tags for rich text in en.json, so emphasis is chosen in one place
 * (one emphasis per marketing headline; never in tests). Works in server and
 * client components: t.rich(key, emphasis).
 *   <i>word</i>        Instrument Serif italic, same size, primary color
 *   <hl>word</hl>      bold with a hand-drawn lilac underline that draws in on view
 *   <b>word</b>        bold (key numbers in stats and results)
 *   <grad>word</grad>  cobalt → coral gradient text (hero headline only)
 */
export const emphasis = {
  i: (chunks: ReactNode) => <em className="text-primary not-italic">{chunks}</em>,
  hl: (chunks: ReactNode) => <Highlight>{chunks}</Highlight>,
  b: (chunks: ReactNode) => <strong className="font-bold">{chunks}</strong>,
  grad: (chunks: ReactNode) => <span className="text-gradient">{chunks}</span>,
};
