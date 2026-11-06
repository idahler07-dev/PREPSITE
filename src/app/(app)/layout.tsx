import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { getCurrentUser, isOwner } from "@/server/auth/session";
import { AppShell, ShellMenuButton, type ShellGroup, type ShellItem } from "@/components/layout/app-shell";
import { TopStats } from "@/components/layout/top-stats";
import { CountdownChip } from "@/components/layout/countdown-chip";
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

/** Signed-in app pages: a grouped sidebar (desktop) or five bottom tabs (phones), and a top bar with search, the test countdown, streak and the account menu. */
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
  const g = await getTranslations("shell.groups");
  // v3 plan §5: Dashboard · Study · Practice · Insights · Account.
  const groups: ShellGroup[] = [
    { items: [{ key: "dashboard", href: "/dashboard", label: t("dashboard"), match: ["/onboarding"] }] },
    {
      label: g("study"),
      items: [
        { key: "plan", href: "/plan", label: t("plan") },
        { key: "focus", href: "/focus", label: t("focus") },
      ],
    },
    {
      label: g("practice"),
      items: [
        { key: "practice", href: "/practice", label: t("practice"), match: ["/attempts"] },
        { key: "mocks", href: "/mocks", label: t("mockTests") },
        { key: "review", href: "/review", label: t("mistakeNotebook") },
        { key: "bank", href: "/question-bank", label: t("questionBank") },
        { key: "vocab", href: "/vocab", label: t("vocab") },
      ],
    },
    {
      label: g("insights"),
      items: [
        { key: "analytics", href: "/analytics", label: t("analytics") },
        { key: "topics", href: "/sat", label: t("topics") },
        { key: "history", href: "/history", label: t("studyHistory") },
      ],
    },
  ];
  const footer: ShellItem[] = [
    { key: "settings", href: "/settings", label: t("settings") },
    { key: "billing", href: "/billing", label: t("billing") },
    { key: "resources", href: "/resources", label: t("resources") },
    ...(isOwner(user) ? [{ key: "admin", href: "/manage", label: t("manage") } as const] : []),
  ];
  const mobile: ShellItem[] = [
    { key: "dashboard", href: "/dashboard", label: t("home"), match: ["/onboarding"] },
    { key: "plan", href: "/plan", label: t("study"), match: ["/focus"] },
    { key: "practice", href: "/practice", label: t("practice"), match: ["/attempts", "/mocks", "/review", "/question-bank", "/vocab"] },
    { key: "analytics", href: "/analytics", label: t("insights"), match: ["/sat", "/history"] },
    { key: "me", href: "/settings", label: t("me"), match: ["/billing", "/resources"] },
  ];
  // Phones: the pages inside each bottom tab, as a row under the top bar.
  const tabs: ShellGroup[] = [groups[1]!, groups[2]!, groups[3]!, { items: footer.slice(0, 2) }];

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
          <Logo href="/dashboard" compact className="sm:hidden" />
          <Logo href="/dashboard" className="hidden sm:inline-flex" />
        </div>
        <CommandPaletteButton className="hidden w-64 justify-start md:inline-flex [&>kbd]:ms-auto" />
        <div className="ms-auto flex items-center gap-1 sm:gap-2">
          <CountdownChip testDate={user.testDate} />
          <TopStats stats={stats} />
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
    <AppShell groups={groups} footer={footer} mobile={mobile} tabs={tabs} topBar={topBar} banner={demo}>
      <PageTransition>{children}</PageTransition>
      <CommandPaletteHost signedIn />
    </AppShell>
  );
}
