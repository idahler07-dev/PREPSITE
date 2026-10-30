"use client";

import { useTranslations } from "next-intl";
import { AlertOctagon, AlertTriangle } from "lucide-react";
import { ALL_FLAGS, isBlocking, type Flag } from "@/lib/questions/flags";
import { cn } from "@/lib/utils";

export function FlagBadge({ flag }: { flag: string }) {
  const t = useTranslations("flags");
  if (!(ALL_FLAGS as string[]).includes(flag)) return null;
  const blocking = isBlocking(flag);
  return (
    <span
      title={t(`${flag as Flag}.help`)}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        blocking ? "border-destructive/50 bg-danger-muted text-foreground" : "border-warning/50 bg-warning-muted text-foreground",
      )}
    >
      {blocking ? <AlertOctagon className="size-3 text-destructive" aria-hidden /> : <AlertTriangle className="size-3 text-warning" aria-hidden />}
      {t(`${flag as Flag}.label`)}
    </span>
  );
}

export function FlagList({ flags, detailed = false }: { flags: string[]; detailed?: boolean }) {
  const t = useTranslations("flags");
  const known = flags.filter((f) => (ALL_FLAGS as string[]).includes(f)) as Flag[];
  if (!detailed) {
    return (
      <span className="flex flex-wrap gap-1">
        {known.map((f) => (
          <FlagBadge key={f} flag={f} />
        ))}
      </span>
    );
  }
  return (
    <ul className="space-y-2">
      {known.map((f) => (
        <li key={f} className="flex flex-col gap-1 text-sm">
          <span className="flex flex-wrap items-center gap-2">
            <FlagBadge flag={f} />
            <span className="text-xs text-muted-foreground">{isBlocking(f) ? t("blocking") : t("warning")}</span>
          </span>
          <span className="text-muted-foreground">{t(`${f}.help`)}</span>
        </li>
      ))}
    </ul>
  );
}
