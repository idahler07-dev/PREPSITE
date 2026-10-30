"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { SPR_ALLOWED_CHARS, SPR_MAX_NEGATIVE, validateSprInput, type SprError } from "@/lib/questions/spr";
import { cn } from "@/lib/utils";

const RULES = ["r1", "r2", "r3", "r4", "r5", "r6"] as const;

/** Student-produced response: a large entry box, a live preview of how the answer reads, and the entry rules on demand. */
export function SprInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const t = useTranslations("test");
  const id = useId();
  const error = value ? validateSprInput(value) : null;
  const [num, den] = value.includes("/") ? value.split("/") : [value, null];
  const preview = value.replace(/^-/, "−");

  return (
    <div className="space-y-3">
      <label htmlFor={id} className="block text-small font-medium">
        {t("sprLabel")}
      </label>
      <div className="flex flex-wrap items-stretch gap-3">
        <input
          id={id}
          value={value}
          disabled={disabled}
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          placeholder={t("sprPlaceholder")}
          // A couple of characters beyond the limit are let through so "too long" or
          // "mixed number" can be explained rather than the input silently changing.
          maxLength={SPR_MAX_NEGATIVE + 2}
          onChange={(e) => {
            const v = e.target.value.replace(/[−–]/g, "-").replace(/\s+/g, " ").trimStart();
            if (SPR_ALLOWED_CHARS.test(v)) onChange(v);
          }}
          aria-describedby={`${id}-help`}
          aria-invalid={!!error}
          className={cn(
            "h-16 w-full max-w-[15rem] rounded-2xl border bg-surface px-4 text-center font-mono text-2xl tracking-wide transition-[border-color,box-shadow] outline-none placeholder:font-sans placeholder:text-base placeholder:tracking-normal placeholder:text-muted-foreground/70",
            "focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_25%,transparent)] disabled:opacity-70",
            error && "border-danger focus-visible:border-danger",
          )}
        />
        <div
          aria-live="polite"
          aria-label={t("sprPreview")}
          className="flex min-h-16 min-w-36 flex-1 items-center justify-center rounded-2xl border border-dashed bg-surface-2 px-4 sm:max-w-[15rem]"
        >
          {!value ? (
            <span className="text-small text-muted-foreground">{t("sprEmptyPreview")}</span>
          ) : error ? (
            <span className="font-mono text-xl text-muted-foreground">{preview}</span>
          ) : den != null ? (
            <span className="inline-flex flex-col items-center text-2xl font-medium leading-tight tabular-nums">
              <span className="border-b-2 border-foreground px-2">{num!.replace(/^-/, "−")}</span>
              <span className="px-2">{den}</span>
            </span>
          ) : (
            <span className="text-2xl font-medium tabular-nums">{preview}</span>
          )}
        </div>
      </div>
      <p id={`${id}-help`} className="min-h-5 text-small" aria-live="polite">
        {error && <span className="text-danger-ink">{t(`sprErrors.${error as Exclude<SprError, never>}`)}</span>}
      </p>
      <details className="group rounded-xl">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-md text-small font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
          {t("answerFormat")}
          <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" aria-hidden />
        </summary>
        <ul className="mt-2 list-disc space-y-1 ps-5 text-small text-muted-foreground">
          {RULES.map((r) => (
            <li key={r}>{t(`sprRules.${r}`)}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
