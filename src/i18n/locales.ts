/**
 * Every UI language the site is designed for. Messages live in
 * /messages/{code}.json. Only locales in ENABLED_LOCALES appear in the
 * language switcher and in URLs; enable more as their translations are done.
 */
export const LOCALES = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "uz", label: "O‘zbekcha", dir: "ltr" },
  { code: "uz-Cyrl", label: "Ўзбекча", dir: "ltr" },
  { code: "ru", label: "Русский", dir: "ltr" },
  { code: "kk", label: "Қазақша", dir: "ltr" },
  { code: "ky", label: "Кыргызча", dir: "ltr" },
  { code: "tg", label: "Тоҷикӣ", dir: "ltr" },
  { code: "tr", label: "Türkçe", dir: "ltr" },
  { code: "az", label: "Azərbaycanca", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "hi", label: "हिन्दी", dir: "ltr" },
  { code: "zh", label: "中文", dir: "ltr" },
  { code: "es", label: "Español", dir: "ltr" },
] as const;

export type LocaleCode = (typeof LOCALES)[number]["code"];

/** Phase 1: English, Uzbek (Latin) and Russian. */
export const ENABLED_LOCALES = ["en", "uz", "ru"] as const satisfies readonly LocaleCode[];

export type AppLocale = (typeof ENABLED_LOCALES)[number];

export function isEnabledLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (ENABLED_LOCALES as readonly string[]).includes(value);
}

export function localeDir(code: string): "ltr" | "rtl" {
  return LOCALES.find((l) => l.code === code)?.dir ?? "ltr";
}

export function localeLabel(code: string): string {
  return LOCALES.find((l) => l.code === code)?.label ?? code;
}

/** Language name for AI prompts (explanations are written in the user's language). */
export const LOCALE_ENGLISH_NAMES: Record<LocaleCode, string> = {
  en: "English",
  uz: "Uzbek (Latin script)",
  "uz-Cyrl": "Uzbek (Cyrillic script)",
  ru: "Russian",
  kk: "Kazakh",
  ky: "Kyrgyz",
  tg: "Tajik",
  tr: "Turkish",
  az: "Azerbaijani",
  ar: "Arabic",
  hi: "Hindi",
  zh: "Simplified Chinese",
  es: "Spanish",
};
