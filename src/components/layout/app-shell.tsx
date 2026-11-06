"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, m, type Variants } from "motion/react";
import { LiquidGroup } from "@/components/motion/liquid-group";
import { Dialog } from "radix-ui";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardList,
  CreditCard,
  History,
  House,
  Library,
  ListChecks,
  NotebookPen,
  PenLine,
  Route,
  Settings,
  Shield,
  Target,
  Timer,
  User,
  type LucideIcon,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/layout/logo";
import { MenuBars } from "@/components/ui/menu-bars";
import { fade, spring, useReducedMotionSafe } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Kept for the old collapse cookie (no longer used). */
export const SIDEBAR_COOKIE = "sidebar";

const ICONS = {
  dashboard: House,
  plan: CalendarDays,
  focus: Timer,
  practice: PenLine,
  mocks: ClipboardList,
  review: NotebookPen,
  vocab: BookOpen,
  bank: ListChecks,
  analytics: BarChart3,
  topics: Target,
  history: History,
  settings: Settings,
  billing: CreditCard,
  resources: Library,
  admin: Shield,
  me: User,
  path: Route,
} satisfies Record<string, LucideIcon>;

export interface ShellItem {
  key: keyof typeof ICONS;
  href: string;
  label: string;
  /** Other paths that count as this destination. */
  match?: string[];
}
export interface ShellGroup {
  label?: string;
  items: ShellItem[];
}

function matches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
function isActive(pathname: string, i: ShellItem) {
  return [i.href, ...(i.match ?? [])].some((h) => matches(pathname, h));
}
/** The most specific item that matches (so /mocks/x lights "Mock tests", not a broad parent). */
function activeIn(pathname: string, items: ShellItem[]) {
  let best: ShellItem | null = null;
  let len = -1;
  for (const i of items)
    for (const h of [i.href, ...(i.match ?? [])])
      if (matches(pathname, h) && h.length > len) {
        best = i;
        len = h.length;
      }
  return best;
}

const MenuContext = createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(null);

/** The ☰ button in the phone and tablet top bar; opens the full menu. */
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
      className="-ms-2 flex size-11 items-center justify-center rounded-[var(--radius-input)] text-foreground transition-colors hover:bg-surface-2 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none lg:hidden"
      aria-label={t("openMenu")}
      aria-haspopup="dialog"
      aria-expanded={menu.open}
    >
      <MenuBars />
    </m.button>
  );
}

const listVariants: Variants = { closed: {}, open: { transition: { staggerChildren: 0.02, delayChildren: 0.05 } } };
const itemVariants: Variants = { closed: { opacity: 0, x: -10 }, open: { opacity: 1, x: 0, transition: spring.soft } };

/** One sidebar row. */
function NavRow({ item, active, onClick, size = "md" }: { item: ShellItem; active: boolean; onClick?: () => void; size?: "md" | "lg" }) {
  const Icon = ICONS[item.key] ?? Route;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      data-liquid-key={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-200 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
        size === "lg" ? "h-11 text-[15px]" : "h-10",
        active ? "font-semibold text-primary" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
      )}
    >
      <Icon className={cn("relative size-[18px] shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} strokeWidth={active ? 2.25 : 2} aria-hidden />
      <span className="relative truncate">{item.label}</span>
    </Link>
  );
}

/**
 * Signed-in app chrome (v3 plan §5).
 *  - Desktop: a 248px sidebar in groups (Dashboard · Study · Practice · Insights · Account).
 *  - Phones and tablets: five bottom tabs (Home, Plan, Practice, Insights, Me),
 *    section tabs under the top bar, and ☰ for everything.
 */
export function AppShell({
  groups,
  footer,
  mobile,
  tabs,
  topBar,
  banner,
  children,
}: {
  groups: ShellGroup[];
  footer: ShellItem[];
  mobile: ShellItem[];
  tabs: ShellGroup[];
  topBar: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations("shell");
  const pathname = usePathname();
  const reduce = useReducedMotionSafe();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  const all = [...groups.flatMap((g) => g.items), ...footer];
  const active = activeIn(pathname, all);
  const mobileActive = activeIn(pathname, mobile);
  const sectionTabs = tabs.find((g) => g.items.some((i) => isActive(pathname, i)));

  return (
    <MenuContext.Provider value={{ open: menuOpen, setOpen: setMenuOpen }}>
      <div className="relative isolate flex min-h-dvh flex-col">
        <div className="flex flex-1">
          {/* Desktop sidebar */}
          <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-e border-border bg-surface lg:flex" aria-label={t("appNavigation")}>
            <div className="flex h-16 items-center px-5">
              <Logo href="/dashboard" />
            </div>
            <LiquidGroup as="nav" activeKey={active?.href ?? null} className="flex-1 space-y-5 overflow-y-auto px-3 pt-2 pb-4" indicatorClassName="rounded-xl bg-primary-soft">
              {groups.map((g, gi) => (
                <div key={g.label ?? gi}>
                  {g.label && <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground/80 uppercase">{g.label}</p>}
                  <div className="space-y-0.5">
                    {g.items.map((i) => (
                      <NavRow key={i.href} item={i} active={active?.href === i.href} />
                    ))}
                  </div>
                </div>
              ))}
            </LiquidGroup>
            <LiquidGroup activeKey={footer.some((i) => i.href === active?.href) ? active!.href : null} className="space-y-0.5 border-t border-border px-3 py-3" indicatorClassName="rounded-xl bg-primary-soft">
              {footer.map((i) => (
                <NavRow key={i.href} item={i} active={active?.href === i.href} />
              ))}
            </LiquidGroup>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            {banner}
            {topBar}
            {sectionTabs && <SectionTabs items={sectionTabs.items} pathname={pathname} />}
            <main id="main" className="flex flex-1 flex-col pb-[calc(76px+env(safe-area-inset-bottom))] lg:pb-0">
              {children}
            </main>
          </div>
        </div>

        {/* Phones and tablets: bottom tabs */}
        <nav aria-label={t("appNavigation")} className="glass fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] lg:hidden">
          <LiquidGroup as="ul" activeKey={mobileActive?.href ?? null} className="mx-auto grid h-[68px] max-w-[560px] grid-cols-5 px-2" indicatorClassName="rounded-full bg-primary-soft">
            {mobile.map((i) => {
              const Icon = ICONS[i.key] ?? Route;
              const on = mobileActive?.href === i.href;
              return (
                <li key={i.href} className="flex">
                  <Link href={i.href} aria-current={on ? "page" : undefined} className="relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none">
                    <span data-liquid-key={i.href} className="relative grid h-8 w-14 place-items-center">
                      <m.span className="relative" animate={on && !reduce ? { y: [0, -2, 0] } : { y: 0 }} transition={{ duration: 0.3 }}>
                        <Icon className={cn("size-[22px]", on ? "text-primary" : "text-muted-foreground")} strokeWidth={on ? 2.4 : 2} aria-hidden />
                      </m.span>
                    </span>
                    <span className={cn("text-[11px] font-semibold", on ? "text-primary" : "text-muted-foreground")}>{i.label}</span>
                  </Link>
                </li>
              );
            })}
          </LiquidGroup>
        </nav>

        {/* Phones and tablets: the full menu from ☰ */}
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
                      <Logo href="/dashboard" />
                      <Dialog.Title className="sr-only">{t("menu")}</Dialog.Title>
                      <Dialog.Close asChild>
                        <m.button
                          type="button"
                          whileTap={{ scale: 0.9 }}
                          transition={spring.snappy}
                          className="flex size-11 items-center justify-center rounded-[var(--radius-input)] text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
                          aria-label={t("closeMenu")}
                        >
                          <MenuBars open />
                        </m.button>
                      </Dialog.Close>
                    </div>
                    <m.nav className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-4" aria-label={t("menu")} variants={reduce ? undefined : listVariants} initial="closed" animate="open">
                      {[...groups, { items: footer }].map((g, gi) => (
                        <div key={g.label ?? `g${gi}`} className={cn(!g.label && gi > 0 && "border-t border-border pt-3")}>
                          {g.label && <p className="px-3 pb-1 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground/80 uppercase">{g.label}</p>}
                          {g.items.map((i) => (
                            <m.div key={i.href} variants={reduce ? undefined : itemVariants}>
                              <div className={cn("rounded-xl", active?.href === i.href && "bg-primary-soft")}>
                                <NavRow item={i} active={active?.href === i.href} size="lg" onClick={() => setMenuOpen(false)} />
                              </div>
                            </m.div>
                          ))}
                        </div>
                      ))}
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

/** Phones and tablets: the pages inside a tab, as a row under the top bar. */
function SectionTabs({ items, pathname }: { items: ShellItem[]; pathname: string }) {
  const on = activeIn(pathname, items);
  return (
    <div className="border-b border-border bg-background/80 lg:hidden">
      <LiquidGroup as="nav" activeKey={on?.href ?? null} className="swipe-row mx-auto flex max-w-[1200px] gap-1 overflow-x-auto px-4 py-2 sm:px-6" indicatorClassName="rounded-full bg-primary-soft">
        {items.map((i) => {
          const Icon = ICONS[i.key] ?? Route;
          const active = on?.href === i.href;
          return (
            <Link
              key={i.href}
              href={i.href}
              data-liquid-key={i.href}
              aria-current={active ? "page" : undefined}
              className={cn("relative flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition-colors", active ? "text-primary" : "text-muted-foreground hover:text-foreground")}
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
