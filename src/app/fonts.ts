import { Inter, Plus_Jakarta_Sans, Source_Serif_4 } from "next/font/google";

/** Body and UI. Latin + Latin Extended for names like Oʻgʻiloy. Tabular figures come from `tabular-nums`. */
export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

/** Headings: heavy, rounded-geometric, friendly without being childish. */
export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
  display: "swap",
  variable: "--font-jakarta",
});

/** Reading passages only, so long text reads like the printed test. */
export const sourceSerif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-source-serif",
  // Only practice and lesson screens use it.
  preload: false,
});
