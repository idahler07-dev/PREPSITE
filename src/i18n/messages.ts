import type { AppLocale } from "./locales";

type Messages = Record<string, unknown>;

const loaders: Record<AppLocale, () => Promise<Messages>> = {
  en: () => import("../../messages/en.json").then((m) => m.default),
  uz: () => import("../../messages/uz.json").then((m) => m.default),
  ru: () => import("../../messages/ru.json").then((m) => m.default),
};

function deepMerge(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const [k, v] of Object.entries(override)) {
    const b = out[k];
    out[k] =
      v && typeof v === "object" && !Array.isArray(v) && b && typeof b === "object" && !Array.isArray(b)
        ? deepMerge(b as Messages, v as Messages)
        : v;
  }
  return out;
}

/** Messages for a locale, with English filling any missing keys. */
export async function loadMessages(locale: AppLocale): Promise<Messages> {
  const en = await loaders.en();
  if (locale === "en") return en;
  return deepMerge(en, await loaders[locale]());
}
