/**
 * UI languages. The site is English only; messages live in /messages/{code}.json.
 * To add a language later: add it here, add its messages file and a loader in
 * messages.ts. Components already read every string through next-intl.
 */
export const LOCALES = [{ code: "en", label: "English" }] as const;

export type LocaleCode = (typeof LOCALES)[number]["code"];

export const ENABLED_LOCALES = ["en"] as const satisfies readonly LocaleCode[];

export type AppLocale = (typeof ENABLED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

export function isEnabledLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (ENABLED_LOCALES as readonly string[]).includes(value);
}

/** Language name for AI prompts. */
export const LOCALE_ENGLISH_NAMES: Record<LocaleCode, string> = { en: "English" };

/** Locale prefixes the site used to have in URLs; old links are redirected (see middleware). */
export const RETIRED_LOCALE_PREFIXES = ["en", "uz", "uz-Cyrl", "ru", "kk", "ky", "tg", "tr", "az", "ar", "hi", "zh", "es"];
