import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { env } from "@/lib/env";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CookieNotice } from "@/components/layout/cookie-notice";

export default async function MainLayout({ children }: { children: ReactNode }) {
  const demo = env().DEMO_MODE;
  const t = demo ? await getTranslations("demo") : null;
  return (
    <div className="flex min-h-dvh flex-col">
      {t && <p className="bg-primary px-4 py-1.5 text-center text-sm text-primary-foreground">{t("banner")}</p>}
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <CookieNotice />
    </div>
  );
}
