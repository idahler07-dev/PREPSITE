/**
 * Page background per theme, for places that can't read CSS variables
 * (<meta name="theme-color">, the PWA manifest). Keep in sync with
 * --background in src/app/globals.css (pnpm check:contrast verifies it).
 */
export const THEME_COLORS = { light: "#FFFFFF", dark: "#0A0D18" } as const;
