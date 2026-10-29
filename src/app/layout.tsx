import type { ReactNode } from "react";
import "./globals.css";
import "katex/dist/katex.min.css";

// The <html> element is rendered by app/[locale]/layout.tsx so it can set lang and dir.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
