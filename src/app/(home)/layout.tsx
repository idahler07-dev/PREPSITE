import type { ReactNode } from "react";
import { CookieNotice } from "@/components/layout/cookie-notice";
import { DemoBanner, showDemoBanner } from "@/components/layout/demo-banner";

/** The landing page brings its own header and footer (from the design), so this layout adds only notices. */
export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-white text-[#0B0B0C]">
      {showDemoBanner() && <DemoBanner />}
      <main id="main">{children}</main>
      <CookieNotice />
    </div>
  );
}
