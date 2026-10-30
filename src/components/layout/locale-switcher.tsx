"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { ENABLED_LOCALES, localeLabel, type AppLocale } from "@/i18n/locales";
import { saveLocalePreference } from "@/server/actions/preferences";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function LocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("language");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [pending, startTransition] = useTransition();

  function change(next: string) {
    startTransition(async () => {
      await saveLocalePreference(next);
      // @ts-expect-error -- params of the current dynamic route are passed through unchanged
      router.replace({ pathname, params }, { locale: next as AppLocale });
    });
  }

  return (
    <Select value={locale} onValueChange={change} disabled={pending}>
      <SelectTrigger aria-label={t("label")} size="sm" className={compact ? "w-auto gap-1" : "w-40"}>
        <Globe className="size-4" aria-hidden />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ENABLED_LOCALES.map((l) => (
          <SelectItem key={l} value={l} lang={l}>
            {localeLabel(l)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
