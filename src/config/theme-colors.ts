/**
 * Page background per theme, for places that can't read CSS variables
 * (<meta name="theme-color">, the PWA manifest). Keep in sync with
 * --background in src/app/globals.css (pnpm check:contrast verifies it).
 */
export const THEME_COLORS = { light: "#F5F6FA", dark: "#090C16" } as const;
