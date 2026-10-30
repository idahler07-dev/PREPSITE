import type { ReactNode } from "react";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/server/auth/session";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CookieNotice } from "@/components/layout/cookie-notice";
import { DemoBanner } from "@/components/layout/demo-banner";
import { CommandPalette } from "@/components/layout/command-palette";
import { PageTransition } from "@/components/motion/page-transition";

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-dvh flex-col">
      {env().DEMO_MODE && <DemoBanner />}
      <SiteHeader />
      <main id="main" className="flex flex-1 flex-col">
        <PageTransition>{children}</PageTransition>
      </main>
      <SiteFooter />
      <CookieNotice />
      <CommandPalette signedIn={!!user} />
    </div>
  );
}
