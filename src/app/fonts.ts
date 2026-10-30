import { Literata, Onest } from "next/font/google";

/** Display and headings: Literata (serif, true italics). Latin + Latin Extended for names like Oʻgʻiloy. */
export const literata = Literata({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-literata",
  adjustFontFallback: true,
});

/** UI and body text: Onest. */
export const onest = Onest({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-onest",
  adjustFontFallback: true,
});
