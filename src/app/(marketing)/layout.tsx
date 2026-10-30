import type { ReactNode } from "react";
import { getCurrentUser } from "@/server/auth/session";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CookieNotice } from "@/components/layout/cookie-notice";
import { DemoBanner, showDemoBanner } from "@/components/layout/demo-banner";
import { CommandPaletteHost } from "@/components/layout/command-palette-host";
import { PageTransition } from "@/components/motion/page-transition";

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-dvh flex-col">
      {showDemoBanner() && <DemoBanner />}
      <SiteHeader />
      <main id="main" className="flex flex-1 flex-col">
        <PageTransition>{children}</PageTransition>
      </main>
      <SiteFooter />
      <CookieNotice />
      <CommandPaletteHost signedIn={!!user} />
    </div>
  );
}
