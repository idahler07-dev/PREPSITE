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
        { duration: 450, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" },
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
