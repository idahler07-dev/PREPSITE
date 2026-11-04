"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, m, useReducedMotion, type Variants } from "motion/react";
import { Dialog } from "radix-ui";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardList,
  CreditCard,
  History,
  LayoutDashboard,
  Library,
  ListChecks,
  Menu,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/layout/logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { fade, spring } from "@/lib/motion";
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
  bank: ListChecks,
};

export const SHELL_GROUPS = ["study", "practice", "account"] as const;

export interface ShellItem {
  key: keyof typeof ICONS;
  href: string;
  label: string;
  /** Group in the sidebar and the phone menu. */
  group: (typeof SHELL_GROUPS)[number];
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`) || (href === "/practice" && pathname.startsWith("/attempts"));
}

const MenuContext = createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(null);

/** The ☰ button in the phone and tablet top bar; opens the side menu. */
export function ShellMenuButton() {
  const t = useTranslations("shell");
  const menu = useContext(MenuContext);
  if (!menu) return null;
  return (
    <m.button
      type="button"
      onClick={() => menu.setOpen(true)}
      whileTap={{ scale: 0.9 }}
      transition={spring.snappy}
      className="-ms-2 flex size-10 items-center justify-center rounded-[var(--radius-input)] text-foreground transition-colors hover:bg-surface-2 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none lg:hidden"
      aria-label={t("openMenu")}
      aria-haspopup="dialog"
      aria-expanded={menu.open}
    >
      <Menu className="size-5" aria-hidden />
    </m.button>
  );
}

/** Menu links: the panel slides in, then the groups and links follow in a short stagger. */
const listVariants: Variants = {
  closed: {},
  open: { transition: { staggerChildren: 0.025, delayChildren: 0.06 } },
};
const itemVariants: Variants = {
  closed: { opacity: 0, x: -12 },
  open: { opacity: 1, x: 0, transition: spring.soft },
};

/**
 * App pages: sidebar on desktop (collapses to icons; remembered in a cookie so
 * there's no layout shift on load); on phones and tablets the same groups live
 * in a side menu opened from the ☰ button. The panel slides in (spring.soft),
 * links follow in a short stagger, a swipe left closes it, and the active
 * item's pill slides between links (spring.snappy).
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
  const [menuOpen, setMenuOpen] = useState(false);
  const transition = reduce ? { duration: 0 } : spring.snappy;

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "open"}; path=/; max-age=31536000; samesite=lax`;
  }

  // Close the menu after navigating (also covers back/forward).
  useEffect(() => setMenuOpen(false), [pathname]);

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
        {active && <m.span layoutId="sidebar-active" className="absolute inset-0 rounded-[var(--radius-input)] bg-primary-soft" transition={transition} aria-hidden />}
        <Icon className="relative size-[18px] shrink-0" aria-hidden />
        <m.span className="relative truncate" animate={{ opacity: collapsed ? 0 : 1 }} transition={transition}>
          {i.label}
        </m.span>
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
    <MenuContext.Provider value={{ open: menuOpen, setOpen: setMenuOpen }}>
    <div className="relative isolate flex min-h-dvh flex-col">
      <div className="app-ambient" aria-hidden />
      <div className="flex flex-1">
        <m.aside
          layout
          transition={transition}
          className={cn(
            "sticky top-0 hidden h-dvh shrink-0 flex-col border-e border-[var(--glass-edge)] bg-[color-mix(in_oklab,var(--surface)_58%,transparent)] py-4 lg:flex",
            collapsed ? "w-[76px] px-3" : "w-64 px-4",
          )}
          aria-label={t("appNavigation")}
        >
          <div className={cn("mb-6 flex h-10 items-center", collapsed ? "justify-center" : "px-2")}>
            <Logo href="/dashboard" compact={collapsed} />
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
            {SHELL_GROUPS.map((g, gi) => {
              const groupItems = items.filter((i) => i.group === g);
              if (!groupItems.length) return null;
              return (
                <div key={g} role="group" aria-labelledby={`nav-group-${g}`} className="flex flex-col gap-1">
                  {collapsed ? (
                    <>
                      {gi > 0 && <div className="mx-2 my-2 h-px bg-border" aria-hidden />}
                      <span id={`nav-group-${g}`} className="sr-only">
                        {t(`groups.${g}`)}
                      </span>
                    </>
                  ) : (
                    <p id={`nav-group-${g}`} className={cn("px-3 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase", gi > 0 && "pt-4")}>
                      {t(`groups.${g}`)}
                    </p>
                  )}
                  {groupItems.map(link)}
                </div>
              );
            })}
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
        </m.aside>

        <m.div layout transition={transition} className="flex min-w-0 flex-1 flex-col">
          {banner}
          {topBar}
          <main id="main" className="flex flex-1 flex-col">
            {children}
          </main>
        </m.div>
      </div>

      {/* Phones and tablets: side menu. */}
      <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <AnimatePresence>
          {menuOpen && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild forceMount>
                <m.div
                  className="fixed inset-0 z-50 bg-overlay backdrop-blur-[2px] lg:hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={fade}
                />
              </Dialog.Overlay>
              <Dialog.Content asChild forceMount aria-describedby={undefined}>
                <m.div
                  className="fixed inset-y-0 start-0 z-50 flex w-[min(20rem,86vw)] flex-col border-e glass pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] shadow-[var(--glass-shadow)] outline-none lg:hidden"
                  initial={reduce ? { opacity: 0 } : { x: "-100%" }}
                  animate={reduce ? { opacity: 1 } : { x: 0 }}
                  exit={reduce ? { opacity: 0 } : { x: "-100%" }}
                  transition={reduce ? fade : spring.soft}
                  drag={reduce ? false : "x"}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={{ left: 0.5, right: 0 }}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -80 || info.velocity.x < -500) setMenuOpen(false);
                  }}
                >
                  <div className="flex h-16 items-center justify-between border-b px-4">
                    <Logo href="/dashboard" />
                    <Dialog.Title className="sr-only">{t("menu")}</Dialog.Title>
                    <Dialog.Close asChild>
                      <m.button
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        transition={spring.snappy}
                        className="flex size-10 items-center justify-center rounded-[var(--radius-input)] text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
                        aria-label={t("closeMenu")}
                      >
                        <X className="size-5" aria-hidden />
                      </m.button>
                    </Dialog.Close>
                  </div>
                  <m.nav
                    className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-3 py-4"
                    aria-label={t("appNavigation")}
                    variants={reduce ? undefined : listVariants}
                    initial="closed"
                    animate="open"
                  >
                    {SHELL_GROUPS.map((g, gi) => {
                      const groupItems = items.filter((i) => i.group === g);
                      if (!groupItems.length) return null;
                      return (
                        <div key={g} role="group" aria-labelledby={`menu-group-${g}`} className="flex flex-col gap-1">
                          <m.p
                            id={`menu-group-${g}`}
                            variants={reduce ? undefined : itemVariants}
                            className={cn("px-3 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase", gi > 0 && "pt-4")}
                          >
                            {t(`groups.${g}`)}
                          </m.p>
                          {groupItems.map((i) => {
                            const Icon = ICONS[i.key] ?? LayoutDashboard;
                            const active = isActive(pathname, i.href);
                            return (
                              <m.div key={i.href} variants={reduce ? undefined : itemVariants}>
                                <Link
                                  href={i.href}
                                  onClick={() => setMenuOpen(false)}
                                  aria-current={active ? "page" : undefined}
                                  className={cn(
                                    "relative flex h-11 items-center gap-3 rounded-[var(--radius-input)] px-3 text-[15px] font-medium transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
                                    active ? "text-primary" : "text-foreground hover:bg-surface-2",
                                  )}
                                >
                                  {active && <m.span layoutId="menu-active" className="absolute inset-0 rounded-[var(--radius-input)] bg-primary-soft" transition={transition} aria-hidden />}
                                  <Icon className={cn("relative size-[18px] shrink-0", !active && "text-muted-foreground")} aria-hidden />
                                  <span className="relative truncate">{i.label}</span>
                                </Link>
                              </m.div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </m.nav>
                </m.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </div>
    </MenuContext.Provider>
  );
}
