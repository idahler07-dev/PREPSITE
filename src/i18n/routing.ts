import { defineRouting } from "next-intl/routing";
import siteConfig from "@site";
import { ENABLED_LOCALES, isEnabledLocale } from "./locales";

export const routing = defineRouting({
  locales: ENABLED_LOCALES,
  defaultLocale: isEnabledLocale(siteConfig.defaultLocale) ? siteConfig.defaultLocale : "en",
  localePrefix: "always",
  localeCookie: { name: "NEXT_LOCALE", maxAge: 60 * 60 * 24 * 365 },
});
