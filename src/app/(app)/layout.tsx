import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { getCurrentUser, isOwner } from "@/server/auth/session";
import { AppShell, ShellMenuButton, type ShellItem, type ShellTabs } from "@/components/layout/app-shell";
import { TopStats } from "@/components/layout/top-stats";
import { topBarStats } from "@/server/stats/topbar";
import { Logo } from "@/components/layout/logo";
import { CommandPaletteButton } from "@/components/layout/command-palette-button";
import { CommandPaletteHost } from "@/components/layout/command-palette-host";
import { ThemeOrb, ThemeSync } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { PageTransition } from "@/components/motion/page-transition";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CookieNotice } from "@/components/layout/cookie-notice";
import { DemoBanner, showDemoBanner } from "@/components/layout/demo-banner";

/** Signed-in app pages: five destinations in a slim sidebar (desktop) or bottom tab bar (phones), and a top bar with days to the SAT, streak, XP and estimated score. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const demo = showDemoBanner() ? <DemoBanner /> : null;

  // Pages here redirect signed-out visitors to sign in; until then, show the public chrome.
  if (!user) {
    return (
      <div className="flex min-h-dvh flex-col">
        {demo}
        <SiteHeader />
        <main id="main" className="flex flex-1 flex-col">
          {children}
        </main>
        <SiteFooter />
        <CookieNotice />
      </div>
    );
  }

  const t = await getTranslations("nav");
  // The five destinations (brief §5), then their tabs, then everything else.
  const items: ShellItem[] = [
    { key: "path", href: "/sat", label: t("path"), match: ["/dashboard", "/plan", "/onboarding"] },
    { key: "practice", href: "/practice", label: t("practice"), match: ["/question-bank", "/review", "/vocab", "/attempts"] },
    { key: "tests", href: "/mocks", label: t("tests") },
    { key: "progress", href: "/analytics", label: t("progress"), match: ["/history"] },
    { key: "profile", href: "/settings", label: t("profile"), match: ["/billing"] },
  ];
  const tabs: ShellTabs[] = [
    {
      parent: "/practice",
      items: [
        { key: "drills", href: "/practice", label: t("drills"), match: ["/attempts"] },
        { key: "bank", href: "/question-bank", label: t("questionBank") },
        { key: "review", href: "/review", label: t("review") },
        { key: "vocab", href: "/vocab", label: t("vocab") },
      ],
    },
    {
      parent: "/analytics",
      items: [
        { key: "analytics", href: "/analytics", label: t("overview") },
        { key: "history", href: "/history", label: t("history") },
      ],
    },
    {
      parent: "/settings",
      items: [
        { key: "settings", href: "/settings", label: t("settings") },
        { key: "billing", href: "/billing", label: t("billing") },
      ],
    },
  ];
  const more: ShellItem[] = [
    { key: "plan", href: "/plan", label: t("plan") },
    { key: "resources", href: "/resources", label: t("resources") },
    ...(isOwner(user) ? [{ key: "admin", href: "/manage", label: t("manage") } as const] : []),
  ];

  const c = await getTranslations("common");
  const stats = await topBarStats(user.id, user.timeZone);

  const topBar = (
    <header className="glass sticky top-0 z-30 border-b">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        {c("skipToContent")}
      </a>
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-2 px-4 sm:px-6">
        <div className="flex items-center gap-1 lg:hidden">
          <ShellMenuButton />
          <Logo href="/sat" compact className="sm:hidden" />
          <Logo href="/sat" className="hidden sm:inline-flex" />
        </div>
        <div className="ms-auto flex items-center gap-1 sm:gap-2">
          <TopStats stats={stats} testDate={user.testDate} />
          <CommandPaletteButton className="hidden md:inline-flex" />
          <span className="hidden sm:inline-flex">
            <ThemeOrb signedIn />
          </span>
          <ThemeSync theme={user.theme} />
          <UserMenu name={user.name} email={user.email} isOwner={isOwner(user)} />
        </div>
      </div>
    </header>
  );

  return (
    <AppShell items={items} more={more} tabs={tabs} topBar={topBar} banner={demo}>
      <PageTransition>{children}</PageTransition>
      <CommandPaletteHost signedIn />
    </AppShell>
  );
}
