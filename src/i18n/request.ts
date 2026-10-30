import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE } from "./locales";
import { loadMessages } from "./messages";

// No locale in URLs: every request uses the default (English) messages.
export default getRequestConfig(async () => ({
  locale: DEFAULT_LOCALE,
  messages: await loadMessages(DEFAULT_LOCALE),
  timeZone: "Asia/Tashkent",
}));
