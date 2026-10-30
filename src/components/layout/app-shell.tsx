"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardList,
  CreditCard,
  History,
  LayoutDashboard,
  Library,
  MoreHorizontal,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/layout/logo";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const SIDEBAR_COOKIE = "sidebar";

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  practice: Zap,
  mocks: ClipboardList,
  plan: CalendarDays,
  review: NotebookPen,
  vocab: BookOpen,
  history: History,
  resources: Library,
  billing: CreditCard,
  settings: Settings,
  admin: Shield,
  mistakes: NotebookPen,
  analytics: BarChart3,
};

export interface ShellItem {
  key: keyof typeof ICONS;
  href: string;
  label: string;
  /** "main" items are in the sidebar's first group and (first four) in the mobile tab bar. */
  group: "main" | "more";
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`) || (href === "/practice" && pathname.startsWith("/attempts"));
}

/**
 * App pages: sidebar on desktop (collapses to icons; remembered in a cookie so
 * there's no layout shift on load), bottom tab bar on phones with a "More"
 * sheet. The active item's pill slides between links (spring.snappy).
 */
export function AppShell({
  items,
  initialCollapsed,
  topBar,
  banner,
  children,
}: {
  items: ShellItem[];
  initialCollapsed: boolean;
  topBar: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations("shell");
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [moreOpen, setMoreOpen] = useState(false);
  const transition = reduce ? { duration: 0 } : spring.snappy;

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "open"}; path=/; max-age=31536000; samesite=lax`;
  }

  const main = items.filter((i) => i.group === "main");
  const more = items.filter((i) => i.group === "more");
  const tabs = main.slice(0, 4);
  const inMore = [...main.slice(4), ...more];
  const moreActive = inMore.some((i) => isActive(pathname, i.href));

  const link = (i: ShellItem) => {
    const Icon = ICONS[i.key] ?? LayoutDashboard;
    const active = isActive(pathname, i.href);
    const el = (
      <Link
        href={i.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex h-10 items-center gap-3 rounded-[var(--radius-input)] px-3 text-sm font-medium transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
          active ? "text-primary" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
        )}
      >
        {active && <motion.span layoutId="sidebar-active" className="absolute inset-0 rounded-[var(--radius-input)] bg-primary-soft" transition={transition} aria-hidden />}
        <Icon className="relative size-[18px] shrink-0" aria-hidden />
        <motion.span className="relative truncate" animate={{ opacity: collapsed ? 0 : 1 }} transition={transition}>
          {i.label}
        </motion.span>
      </Link>
    );
    return collapsed ? (
      <Tooltip key={i.href}>
        <TooltipTrigger asChild>{el}</TooltipTrigger>
        <TooltipContent side="right">{i.label}</TooltipContent>
      </Tooltip>
    ) : (
      <div key={i.href}>{el}</div>
    );
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex flex-1">
        <motion.aside
          layout
          transition={transition}
          className={cn(
            "sticky top-0 hidden h-dvh shrink-0 flex-col border-e bg-surface py-4 lg:flex",
            collapsed ? "w-[76px] px-3" : "w-64 px-4",
          )}
          aria-label={t("appNavigation")}
        >
          <div className={cn("mb-6 flex h-10 items-center", collapsed ? "justify-center" : "px-2")}>
            <Logo href="/dashboard" compact={collapsed} />
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {main.map(link)}
            <div className="my-3 h-px bg-border" aria-hidden />
            {more.map(link)}
          </nav>
          <button
            type="button"
            onClick={toggle}
            className="mt-2 flex h-10 items-center gap-3 rounded-[var(--radius-input)] px-3 text-sm text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
            aria-label={collapsed ? t("expand") : t("collapse")}
            aria-expanded={!collapsed}
          >
            {collapsed ? <PanelLeftOpen className="size-[18px]" aria-hidden /> : <PanelLeftClose className="size-[18px]" aria-hidden />}
            {!collapsed && <span>{t("collapse")}</span>}
          </button>
        </motion.aside>

        <motion.div layout transition={transition} className="flex min-w-0 flex-1 flex-col">
          {banner}
          {topBar}
          <main id="main" className="flex flex-1 flex-col pb-20 lg:pb-0">
            {children}
          </main>
        </motion.div>
      </div>

      {/* Phones: bottom tab bar. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label={t("tabs")}
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {tabs.map((i) => {
            const Icon = ICONS[i.key] ?? LayoutDashboard;
            const active = isActive(pathname, i.href);
            return (
              <li key={i.href}>
                <Link
                  href={i.href}
                  aria-current={active ? "page" : undefined}
                  className={cn("relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium", active ? "text-primary" : "text-muted-foreground")}
                >
                  {active && <motion.span layoutId="tab-active" className="absolute top-1.5 h-8 w-14 rounded-full bg-primary-soft" transition={transition} aria-hidden />}
                  <Icon className="relative size-5" aria-hidden />
                  <span className="relative">{i.label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn("relative flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium", moreActive ? "text-primary" : "text-muted-foreground")}
              aria-haspopup="dialog"
            >
              {moreActive && <motion.span layoutId="tab-active" className="absolute top-1.5 h-8 w-14 rounded-full bg-primary-soft" transition={transition} aria-hidden />}
              <MoreHorizontal className="relative size-5" aria-hidden />
              <span className="relative">{t("more")}</span>
            </button>
          </li>
        </ul>
      </nav>
      <MobileSheet open={moreOpen} onOpenChange={setMoreOpen} title={t("more")}>
        <nav className="grid grid-cols-3 gap-2 pb-2" aria-label={t("more")}>
          {inMore.map((i) => {
            const Icon = ICONS[i.key] ?? LayoutDashboard;
            const active = isActive(pathname, i.href);
            return (
              <Link
                key={i.href}
                href={i.href}
                onClick={() => setMoreOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border p-3 text-center text-xs font-medium transition-colors",
                  active ? "border-primary/40 bg-primary-soft text-primary" : "bg-background hover:bg-surface-2",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {i.label}
              </Link>
            );
          })}
        </nav>
      </MobileSheet>
    </div>
  );
}
