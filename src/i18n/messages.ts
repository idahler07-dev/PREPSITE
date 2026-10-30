import type { AppLocale } from "./locales";

type Messages = Record<string, unknown>;

const loaders: Record<AppLocale, () => Promise<Messages>> = {
  en: () => import("../../messages/en.json").then((m) => m.default),
};

/** Messages for a locale (English is the only one). */
export async function loadMessages(locale: AppLocale): Promise<Messages> {
  return loaders[locale]();
}
