import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

/** UI, headings and body. Latin + Latin Extended for names like Oʻgʻiloy. */
export const geist = Geist({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-geist",
});

/** Numbers, timers and code (tabular figures). */
export const geistMono = Geist_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-geist-mono",
});

/** Emphasis words in marketing headlines only (italic). */
export const instrumentSerif = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: "italic",
  display: "swap",
  variable: "--font-instrument-serif",
});
