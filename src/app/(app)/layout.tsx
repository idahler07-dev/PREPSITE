import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { getCurrentUser, isOwner } from "@/server/auth/session";
import {
  AppShell,
  ShellMenuButton,
  type ShellGroup,
  type ShellItem,
} from "@/components/layout/app-shell";
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
import { ArrowRight } from "lucide-react";
import { getEntitlement } from "@/server/billing/entitlement";
import { Link } from "@/i18n/navigation";

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
    {
      items: [
        {
          key: "dashboard",
          href: "/dashboard",
          label: t("dashboard"),
          match: ["/onboarding"],
        },
        { key: "plan", href: "/plan", label: t("studyPlan") },
        { key: "focus", href: "/focus", label: t("focusShort") },
        {
          key: "practice",
          href: "/practice",
          label: t("practice"),
          match: ["/attempts"],
        },
        { key: "mocks", href: "/mocks", label: t("mockTests") },
        { key: "review", href: "/review", label: t("mistakes") },
        { key: "vocab", href: "/vocab", label: t("vocab") },
        { key: "analytics", href: "/analytics", label: t("analytics") },
      ],
    },
    {
      label: g("more"),
      items: [
        { key: "bank", href: "/question-bank", label: t("questionBank") },
        { key: "topics", href: "/sat", label: t("topics") },
        { key: "history", href: "/history", label: t("studyHistory") },
      ],
    },
  ];
  const footer: ShellItem[] = [
    { key: "settings", href: "/settings", label: t("settings") },
    { key: "billing", href: "/billing", label: t("billing") },
    { key: "resources", href: "/resources", label: t("resources") },
    ...(isOwner(user)
      ? [{ key: "admin", href: "/manage", label: t("manage") } as const]
      : []),
  ];
  const mobile: ShellItem[] = [
    {
      key: "dashboard",
      href: "/dashboard",
      label: t("home"),
      match: ["/onboarding"],
    },
    { key: "plan", href: "/plan", label: t("study"), match: ["/focus"] },
    {
      key: "practice",
      href: "/practice",
      label: t("practice"),
      match: ["/attempts", "/mocks", "/review", "/question-bank", "/vocab"],
    },
    {
      key: "analytics",
      href: "/analytics",
      label: t("insights"),
      match: ["/sat", "/history"],
    },
    {
      key: "me",
      href: "/settings",
      label: t("me"),
      match: ["/billing", "/resources"],
    },
  ];
  // Phones: the pages inside each bottom tab, as a row under the top bar.
  const main = groups[0]!.items;
  const more = groups[1]!.items;
  const tabs: ShellGroup[] = [
    { items: [main[1]!, main[2]!] },
    { items: [main[3]!, main[4]!, main[5]!, more[0]!, main[6]!] },
    { items: [main[7]!, more[1]!, more[2]!] },
    { items: footer.slice(0, 2) },
  ];
  const premium = isOwner(user) || (await getEntitlement(user.id)).premium;
  const tb = await getTranslations("shell.upgrade");
  const sidebarSlot = premium ? null : (
    <Link
      href="/pricing"
      className="group block rounded-[14px] border border-border bg-surface-2 p-4 transition-colors hover:border-energy/40"
    >
      <div className="flex items-center gap-3">
        <img
          src="/illustrations/fluent/rocket.svg"
          alt=""
          className="size-9 shrink-0"
        />
        <div className="min-w-0">
          <p className="text-[14px] leading-tight font-extrabold">
            {tb("title")}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-[13px] font-semibold text-energy-ink">
            {tb("cta")}
            <ArrowRight
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </p>
        </div>
      </div>
    </Link>
  );

  const c = await getTranslations("common");
  const stats = await topBarStats(user.id, user.timeZone);

  const topBar = (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        {c("skipToContent")}
      </a>
      <div className="mx-auto flex h-[64px] max-w-[1240px] items-center gap-2 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 lg:hidden">
          <ShellMenuButton />
          <Logo href="/dashboard" compact className="sm:hidden" />
          <Logo href="/dashboard" className="hidden sm:inline-flex" />
        </div>
        <CommandPaletteButton className="hidden h-10 w-[300px] justify-start rounded-full border-border bg-surface-2 px-4 shadow-none md:inline-flex [&>kbd]:ms-auto" />
        <div className="ms-auto flex items-center gap-1 sm:gap-2">
          <CountdownChip testDate={user.testDate} />
          <TopStats stats={stats} />
          <span className="hidden sm:inline-flex">
            <ThemeOrb signedIn />
          </span>
          <ThemeSync theme={user.theme} />
          <UserMenu
            name={user.name}
            email={user.email}
            isOwner={isOwner(user)}
          />
        </div>
      </div>
    </header>
  );

  return (
    <AppShell
      groups={groups}
      footer={footer}
      sidebarSlot={sidebarSlot}
      mobile={mobile}
      tabs={tabs}
      topBar={topBar}
      banner={demo}
    >
      <PageTransition>{children}</PageTransition>
      <CommandPaletteHost signedIn />
    </AppShell>
  );
}
