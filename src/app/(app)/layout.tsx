import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { getCurrentUser, isOwner } from "@/server/auth/session";
import { AppShell, SIDEBAR_COOKIE, type ShellItem } from "@/components/layout/app-shell";
import { Logo } from "@/components/layout/logo";
import { CountdownChip } from "@/components/layout/countdown-chip";
import { CommandPaletteButton } from "@/components/layout/command-palette-button";
import { CommandPaletteHost } from "@/components/layout/command-palette-host";
import { ThemeSync, ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { PageTransition } from "@/components/motion/page-transition";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CookieNotice } from "@/components/layout/cookie-notice";
import { DemoBanner, showDemoBanner } from "@/components/layout/demo-banner";

/** Signed-in app pages: sidebar (desktop) / bottom tabs (phones), top bar with countdown and search. */
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
  // Sidebar groups (desktop); `tab` puts an item in the phone tab bar, in that order, with an optional shorter label.
  const items: ShellItem[] = [
    { key: "dashboard", href: "/dashboard", label: t("home"), group: "study", tab: 1 },
    { key: "plan", href: "/plan", label: t("plan"), group: "study" },
    { key: "analytics", href: "/analytics", label: t("analytics"), group: "study" },
    { key: "mistakes", href: "/review", label: t("mistakes"), group: "study" },
    { key: "vocab", href: "/vocab", label: t("vocab"), group: "study" },
    { key: "bank", href: "/question-bank", label: t("questionBank"), group: "practice", tab: 3 },
    { key: "practice", href: "/practice", label: t("drills"), tabLabel: t("practice"), group: "practice", tab: 2 },
    { key: "mocks", href: "/mocks", label: t("mockTests"), tabLabel: t("tests"), group: "practice", tab: 4 },
    { key: "history", href: "/history", label: t("history"), group: "practice" },
    { key: "settings", href: "/settings", label: t("settings"), group: "account" },
    { key: "billing", href: "/billing", label: t("billing"), group: "account" },
    { key: "resources", href: "/resources", label: t("resources"), group: "account" },
    ...(isOwner(user) ? [{ key: "admin", href: "/manage", label: t("manage"), group: "account" } as const] : []),
  ];

  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "collapsed";
  const c = await getTranslations("common");

  const topBar = (
    <header className="glass sticky top-0 z-30 border-b">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        {c("skipToContent")}
      </a>
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-2 px-4 sm:px-6">
        <div className="lg:hidden">
          <Logo href="/dashboard" />
        </div>
        <div className="ms-auto flex items-center gap-2">
          <CountdownChip testDate={user.testDate} />
          <CommandPaletteButton />
          <ThemeToggle signedIn />
          <ThemeSync theme={user.theme} />
          <UserMenu name={user.name} email={user.email} isOwner={isOwner(user)} />
        </div>
      </div>
    </header>
  );

  return (
    <AppShell items={items} initialCollapsed={collapsed} topBar={topBar} banner={demo}>
      <PageTransition>{children}</PageTransition>
      <CommandPaletteHost signedIn />
    </AppShell>
  );
}
