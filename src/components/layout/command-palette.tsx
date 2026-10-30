"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { BookOpen, CalendarDays, ClipboardList, CreditCard, History, LayoutDashboard, Library, Monitor, Moon, NotebookPen, Search, Settings, Sun, Target, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "@/i18n/navigation";
import { DOMAINS } from "@/lib/taxonomy";
import { useStartDrill } from "@/components/practice/use-start-drill";

const KEY_ESC = "Esc";

/** Ctrl/Cmd + K: jump to pages, start a drill on any domain, change settings. */
export function CommandPalette({ signedIn, openOnMount = false }: { signedIn: boolean; openOnMount?: boolean }) {
  const t = useTranslations("command");
  const nav = useTranslations("nav");
  const tx = useTranslations("taxonomy");
  const th = useTranslations("theme");
  const router = useRouter();
  const { setTheme } = useTheme();
  const { launch } = useStartDrill();
  const [open, setOpen] = useState(openOnMount);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  const pages = signedIn
    ? [
        { href: "/dashboard", label: nav("dashboard"), icon: LayoutDashboard },
        { href: "/practice", label: nav("practice"), icon: Zap },
        { href: "/mocks", label: nav("mocks"), icon: ClipboardList },
        { href: "/plan", label: nav("plan"), icon: CalendarDays },
        { href: "/review", label: nav("review"), icon: NotebookPen },
        { href: "/vocab", label: nav("vocab"), icon: BookOpen },
        { href: "/history", label: nav("history"), icon: History },
        { href: "/resources", label: nav("resources"), icon: Library },
      ]
    : [
        { href: "/", label: nav("home"), icon: LayoutDashboard },
        { href: "/pricing", label: nav("pricing"), icon: CreditCard },
        { href: "/resources", label: nav("resources"), icon: Library },
        { href: "/faq", label: nav("faq"), icon: BookOpen },
        { href: "/login", label: nav("signIn"), icon: Target },
      ];

  const item = "flex cursor-pointer items-center gap-3 rounded-[var(--radius-input)] px-3 py-2.5 text-sm aria-selected:bg-primary-soft aria-selected:text-foreground [&_svg]:size-4 [&_svg]:text-muted-foreground";
  const group = "px-1 py-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="glass top-[18%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl" showCloseButton={false}>
        <DialogTitle className="sr-only">{t("title")}</DialogTitle>
        <DialogDescription className="sr-only">{t("description")}</DialogDescription>
        <Command label={t("title")} className="flex max-h-[min(70dvh,480px)] flex-col">
          <div className="flex items-center gap-3 border-b px-4">
            <Search className="size-4 text-muted-foreground" aria-hidden />
            <Command.Input placeholder={t("placeholder")} className="h-12 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground" />
            <kbd>{KEY_ESC}</kbd>
          </div>
          <Command.List className="overflow-y-auto p-1">
            <Command.Empty className="px-4 py-8 text-center text-sm text-muted-foreground">{t("empty")}</Command.Empty>
            <Command.Group heading={t("pages")} className={group}>
              {pages.map((p) => (
                <Command.Item key={p.href} value={p.label} onSelect={run(() => router.push(p.href))} className={item}>
                  <p.icon aria-hidden /> {p.label}
                </Command.Item>
              ))}
            </Command.Group>
            {signedIn && (
              <Command.Group heading={t("drills")} className={group}>
                <Command.Item value={t("drillSection", { section: tx("sections.RW") })} onSelect={run(() => launch({ section: "RW", count: 10 }))} className={item}>
                  <Zap aria-hidden /> {t("drillSection", { section: tx("sections.RW") })}
                </Command.Item>
                <Command.Item value={t("drillSection", { section: tx("sections.MATH") })} onSelect={run(() => launch({ section: "MATH", count: 10 }))} className={item}>
                  <Zap aria-hidden /> {t("drillSection", { section: tx("sections.MATH") })}
                </Command.Item>
                {DOMAINS.map((d) => (
                  <Command.Item key={d.key} value={t("drillDomain", { domain: tx(`domains.${d.key}`) })} onSelect={run(() => launch({ section: d.section, domains: [d.key], count: 10 }))} className={item}>
                    <Target aria-hidden /> {t("drillDomain", { domain: tx(`domains.${d.key}`) })}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
            <Command.Group heading={t("settings")} className={group}>
              {signedIn && (
                <>
                  <Command.Item value={nav("settings")} onSelect={run(() => router.push("/settings"))} className={item}>
                    <Settings aria-hidden /> {nav("settings")}
                  </Command.Item>
                  <Command.Item value={nav("billing")} onSelect={run(() => router.push("/billing"))} className={item}>
                    <CreditCard aria-hidden /> {nav("billing")}
                  </Command.Item>
                </>
              )}
              <Command.Item value={`${th("label")} ${th("light")}`} onSelect={run(() => setTheme("light"))} className={item}>
                <Sun aria-hidden /> {t("themeTo", { theme: th("light") })}
              </Command.Item>
              <Command.Item value={`${th("label")} ${th("dark")}`} onSelect={run(() => setTheme("dark"))} className={item}>
                <Moon aria-hidden /> {t("themeTo", { theme: th("dark") })}
              </Command.Item>
              <Command.Item value={`${th("label")} ${th("system")}`} onSelect={run(() => setTheme("system"))} className={item}>
                <Monitor aria-hidden /> {t("themeTo", { theme: th("system") })}
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

