"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { Monitor, Moon, Sun } from "lucide-react";
import siteConfig from "@site";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { saveThemePreference } from "@/server/actions/preferences";
import { THEME_COLORS } from "@/config/theme-colors";
import { spring } from "@/lib/motion";
import { LiquidGroup } from "@/components/motion/liquid-group";
import { DayNightSwitch } from "@/components/ui/day-night-switch";

type ViewTransitionDoc = Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };

/**
 * Switch theme with a circular reveal from the toggle (View Transitions API),
 * or a 200ms color fade where that isn't supported. Reduced motion: instant.
 */
function useAnimatedThemeChange(origin: React.RefObject<HTMLElement | null>) {
  const { setTheme } = useTheme();
  const reduce = useReducedMotion();
  return (value: string) => {
    const doc = document as ViewTransitionDoc;
    if (reduce) return setTheme(value);
    if (!doc.startViewTransition) {
      document.documentElement.classList.add("theme-fade");
      setTheme(value);
      window.setTimeout(() => document.documentElement.classList.remove("theme-fade"), 250);
      return;
    }
    const rect = origin.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth - 40;
    const y = rect ? rect.top + rect.height / 2 : 32;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const t = doc.startViewTransition(() => flushSync(() => setTheme(value)));
    void t.ready.then(() =>
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 400, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" },
      ),
    );
  };
}

export function ThemeToggle({ signedIn }: { signedIn: boolean }) {
  const t = useTranslations("theme");
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const change = useAnimatedThemeChange(ref);
  useEffect(() => setMounted(true), []);

  function pick(value: string) {
    change(value);
    if (signedIn) void saveThemePreference(value);
  }

  const icon = !mounted ? "system" : theme === "system" ? "system" : resolvedTheme === "dark" ? "dark" : "light";
  const Icon = icon === "dark" ? Moon : icon === "light" ? Sun : Monitor;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button ref={ref} variant="ghost" size="icon" aria-label={t("label")} className="overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <m.span
              key={icon}
              initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
              transition={spring.snappy}
              className="inline-flex"
            >
              <Icon className="size-5" aria-hidden />
            </m.span>
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("label")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={mounted ? (theme ?? "system") : "system"} onValueChange={pick}>
          <DropdownMenuRadioItem value="light">
            <Sun className="size-4" aria-hidden /> {t("light")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="size-4" aria-hidden /> {t("dark")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor className="size-4" aria-hidden /> {t("system")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The day/night switch used in the headers and in Settings ("System" stays in the Theme menu). */
export function ThemeOrb({ signedIn, size = 9 }: { signedIn: boolean; size?: number }) {
  const t = useTranslations("theme");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const change = useAnimatedThemeChange(ref);
  useEffect(() => setMounted(true), []);
  return (
    <span ref={ref} className="inline-flex">
      <DayNightSwitch
        dark={mounted && resolvedTheme === "dark"}
        label={t("darkMode")}
        size={size}
        onChange={(dark) => {
          const value = dark ? "dark" : "light";
          change(value);
          if (signedIn) void saveThemePreference(value);
        }}
      />
    </span>
  );
}

/** Same switch, larger, for the settings page. */
export function DarkModeSwitch({ signedIn }: { signedIn: boolean }) {
  return <ThemeOrb signedIn={signedIn} size={11} />;
}

/** Apply the theme saved in the user's profile on a new device. */
export function ThemeSync({ theme }: { theme: "LIGHT" | "DARK" | "SYSTEM" }) {
  const { setTheme } = useTheme();
  useEffect(() => {
    const key = "theme-synced";
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    setTheme(theme.toLowerCase());
  }, [theme, setTheme]);
  return null;
}

/** Favicon and <meta name="theme-color"> follow the chosen theme, not only the system one. */
export function ThemeMeta() {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    if (!resolvedTheme) return;
    const dark = resolvedTheme === "dark";
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
      meta.content = dark ? THEME_COLORS.dark : THEME_COLORS.light;
      meta.removeAttribute("media");
    }
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"][type="image/svg+xml"]');
    if (icon) icon.href = dark ? siteConfig.logo.markDark : siteConfig.logo.mark;
  }, [resolvedTheme]);
  return null;
}

/** Settings: Light / Dark / System as a segmented control; the highlight glides between them. */
export function ThemeSegmented({ signedIn }: { signedIn: boolean }) {
  const t = useTranslations("theme");
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const change = useAnimatedThemeChange(ref);
  useEffect(() => setMounted(true), []);
  const current = mounted ? (theme ?? "system") : "system";
  const options = [
    { value: "light", label: t("light"), icon: Sun },
    { value: "dark", label: t("dark"), icon: Moon },
    { value: "system", label: t("system"), icon: Monitor },
  ];
  return (
    <div ref={ref}>
      <LiquidGroup activeKey={current} role="radiogroup" aria-label={t("label")} className="inline-flex rounded-2xl bg-surface-2 p-1" indicatorClassName="rounded-xl bg-surface shadow-sm">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            data-liquid-key={o.value}
            aria-checked={current === o.value}
            onClick={() => {
              change(o.value);
              if (signedIn) void saveThemePreference(o.value);
            }}
            className={`relative flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-sm font-bold transition-colors ${current === o.value ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <o.icon className="relative size-4" aria-hidden />
            <span className="relative">{o.label}</span>
          </button>
        ))}
      </LiquidGroup>
    </div>
  );
}
