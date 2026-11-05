"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, m, useReducedMotion, type Variants } from "motion/react";
import { LiquidGroup } from "@/components/motion/liquid-group";
import { Dialog } from "radix-ui";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChartLine,
  ClipboardList,
  CreditCard,
  History,
  Library,
  ListChecks,
  NotebookPen,
  PenLine,
  Route,
  Settings,
  Shield,
  User,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/layout/logo";
import { MenuBars } from "@/components/ui/menu-bars";
import { fade, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Kept for the old collapse cookie (no longer used by the slim sidebar). */
export const SIDEBAR_COOKIE = "sidebar";

const ICONS: Record<string, LucideIcon> = {
  path: Route,
  practice: PenLine,
  tests: ClipboardList,
  progress: ChartLine,
  profile: User,
  drills: Zap,
  bank: ListChecks,
  review: NotebookPen,
  vocab: BookOpen,
  plan: CalendarDays,
  history: History,
  analytics: BarChart3,
  resources: Library,
  billing: CreditCard,
  settings: Settings,
  admin: Shield,
};

export interface ShellItem {
  key: keyof typeof ICONS;
  href: string;
  label: string;
  /** Other paths that count as this destination (sub-pages, tabs). */
  match?: string[];
}

export interface ShellTabs {
  /** The main destination these tabs live under. */
  parent: string;
  items: ShellItem[];
}

function matches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
function isActive(pathname: string, i: ShellItem) {
  return [i.href, ...(i.match ?? [])].some((h) => matches(pathname, h));
}

const MenuContext = createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(null);

/** The ☰ button in the phone and tablet top bar; opens the "more" menu. */
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
      <MenuBars />
    </m.button>
  );
}

const listVariants: Variants = { closed: {}, open: { transition: { staggerChildren: 0.025, delayChildren: 0.06 } } };
const itemVariants: Variants = { closed: { opacity: 0, x: -12 }, open: { opacity: 1, x: 0, transition: spring.soft } };

/**
 * App pages (brief §5): five destinations (Path, Practice, Tests, Progress,
 * Profile). Desktop: a slim left sidebar. Phones and tablets: a bottom tab
 * bar with a liquid indicator, plus a ☰ menu for everything else. Pages
 * inside a destination (e.g. Practice: Drills, Question bank, Review,
 * Vocabulary) get a row of tabs under the top bar.
 */
export function AppShell({
  items,
  more,
  tabs,
  topBar,
  banner,
  children,
}: {
  items: ShellItem[];
  more: ShellItem[];
  tabs: ShellTabs[];
  topBar: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations("shell");
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  const activeTabs = tabs.find((g) => g.items.some((i) => isActive(pathname, i)));
  const activeHref = items.find((i) => isActive(pathname, i))?.href ?? null;

  return (
    <MenuContext.Provider value={{ open: menuOpen, setOpen: setMenuOpen }}>
      <div className="relative isolate flex min-h-dvh flex-col">
        <div className="flex flex-1">
          {/* Desktop sidebar */}
          <aside className="sticky top-0 hidden h-dvh w-[232px] shrink-0 flex-col border-e border-border bg-surface px-4 py-5 lg:flex" aria-label={t("appNavigation")}>
            <div className="mb-7 px-2">
              <Logo href="/sat" />
            </div>
            <LiquidGroup as="nav" activeKey={activeHref} className="flex flex-col gap-1.5" indicatorClassName="rounded-2xl border-2 border-primary/45 bg-primary-soft">
                {items.map((i) => {
                  const Icon = ICONS[i.key] ?? Route;
                  const active = isActive(pathname, i);
                  return (
                    <Link
                      key={i.href}
                      data-liquid-key={i.href}
                      href={i.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex h-12 items-center gap-3.5 rounded-2xl px-3.5 font-display text-[13px] font-extrabold tracking-[0.06em] uppercase transition-colors duration-200 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
                        active ? "text-primary" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                      )}
                    >
                      <Icon className="relative size-5 shrink-0" strokeWidth={2.25} aria-hidden />
                      <span className="relative">{i.label}</span>
                    </Link>
                  );
                })}
            </LiquidGroup>
            <div className="mt-auto border-t border-border pt-4">
              <p className="px-3.5 pb-1 text-xs font-semibold text-muted-foreground">{t("more")}</p>
              {more.map((i) => {
                const Icon = ICONS[i.key] ?? Route;
                const active = isActive(pathname, i);
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    aria-current={active ? "page" : undefined}
                    className={cn("flex h-9 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition-colors", active ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground")}
                  >
                    <Icon className="size-4" aria-hidden />
                    {i.label}
                  </Link>
                );
              })}
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            {banner}
            {topBar}
            {activeTabs && <SectionTabs items={activeTabs.items} pathname={pathname} />}
            <main id="main" className="flex flex-1 flex-col pb-[calc(76px+env(safe-area-inset-bottom))] lg:pb-0">
              {children}
            </main>
          </div>
        </div>

        {/* Phones and tablets: bottom tab bar */}
        <nav aria-label={t("appNavigation")} className="glass fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] lg:hidden">
          <LiquidGroup as="ul" activeKey={activeHref} className="mx-auto grid h-[68px] max-w-[560px] grid-cols-5 px-2" indicatorClassName="rounded-full bg-primary-soft">
              {items.map((i) => {
                const Icon = ICONS[i.key] ?? Route;
                const active = isActive(pathname, i);
                return (
                  <li key={i.href} className="flex">
                    <Link href={i.href} aria-current={active ? "page" : undefined} className="relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none">
                      <span data-liquid-key={i.href} className="relative grid h-8 w-14 place-items-center">
                        <m.span className="relative" animate={active && !reduce ? { y: [0, -3, 0] } : { y: 0 }} transition={{ duration: 0.35 }}>
                          <Icon className={cn("size-[22px]", active ? "text-primary" : "text-muted-foreground")} strokeWidth={active ? 2.5 : 2} aria-hidden />
                        </m.span>
                      </span>
                      <span className={cn("text-[11px] font-bold", active ? "text-primary" : "text-muted-foreground")}>{i.label}</span>
                    </Link>
                  </li>
                );
              })}
          </LiquidGroup>
        </nav>

        {/* Phones and tablets: "more" menu from ☰ */}
        <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <AnimatePresence>
            {menuOpen && (
              <Dialog.Portal forceMount>
                <Dialog.Overlay asChild forceMount>
                  <m.div className="fixed inset-0 z-50 bg-overlay backdrop-blur-[2px] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade} />
                </Dialog.Overlay>
                <Dialog.Content asChild forceMount aria-describedby={undefined}>
                  <m.div
                    className="fixed inset-y-0 start-0 z-50 flex w-[min(20rem,86vw)] flex-col border-e bg-surface pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] shadow-lg outline-none lg:hidden"
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
                      <Logo href="/sat" />
                      <Dialog.Title className="sr-only">{t("menu")}</Dialog.Title>
                      <Dialog.Close asChild>
                        <m.button
                          type="button"
                          whileTap={{ scale: 0.9 }}
                          transition={spring.snappy}
                          className="flex size-10 items-center justify-center rounded-[var(--radius-input)] text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
                          aria-label={t("closeMenu")}
                        >
                          <MenuBars open />
                        </m.button>
                      </Dialog.Close>
                    </div>
                    <m.nav className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-3 py-4" aria-label={t("more")} variants={reduce ? undefined : listVariants} initial="closed" animate="open">
                      {[...tabs.flatMap((g) => g.items), ...more].map((i) => {
                        const Icon = ICONS[i.key] ?? Route;
                        const active = isActive(pathname, i);
                        return (
                          <m.div key={i.href} variants={reduce ? undefined : itemVariants}>
                            <Link
                              href={i.href}
                              onClick={() => setMenuOpen(false)}
                              aria-current={active ? "page" : undefined}
                              className={cn("relative flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors", active ? "bg-primary-soft text-primary" : "text-foreground hover:bg-surface-2")}
                            >
                              <Icon className={cn("size-[18px] shrink-0", !active && "text-muted-foreground")} aria-hidden />
                              {i.label}
                            </Link>
                          </m.div>
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

/** Tabs inside a destination: the highlight glides between them like liquid. */
function SectionTabs({ items, pathname }: { items: ShellItem[]; pathname: string }) {
  const activeHref = items.find((i) => isActive(pathname, i))?.href ?? null;
  return (
    <div className="border-b border-border bg-background/80">
      <LiquidGroup
        as="nav"
        activeKey={activeHref}
        className="swipe-row mx-auto flex max-w-[1200px] gap-1 overflow-x-auto px-4 py-2 sm:px-6"
        indicatorClassName="rounded-full bg-primary shadow-[0_3px_0_var(--primary-edge)]"
      >
        {items.map((i) => {
          const Icon = ICONS[i.key] ?? Route;
          const active = isActive(pathname, i);
          return (
            <Link
              key={i.href}
              href={i.href}
              data-liquid-key={i.href}
              aria-current={active ? "page" : undefined}
              className={cn("relative flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-bold transition-colors", active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <Icon className="relative size-4" aria-hidden />
              <span className="relative">{i.label}</span>
            </Link>
          );
        })}
      </LiquidGroup>
    </div>
  );
}
