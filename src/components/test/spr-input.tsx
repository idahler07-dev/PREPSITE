"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { SPR_ALLOWED_CHARS, SPR_MAX_NEGATIVE, validateSprInput, type SprError } from "@/lib/questions/spr";
import { Input } from "@/components/ui/input";

/** Student-produced response box with the SAT entry rules and a preview. */
export function SprInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const t = useTranslations("test");
  const id = useId();
  const error = value ? validateSprInput(value) : null;
  const [num, den] = value.includes("/") ? value.split("/") : [value, null];

  return (
    <div className="max-w-sm space-y-3">
      <label htmlFor={id} className="text-sm font-medium">
        {t("sprLabel")}
      </label>
      <Input
        id={id}
        value={value}
        disabled={disabled}
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        // A couple of characters beyond the limit are let through so "too long" or
        // "mixed number" can be explained rather than the input silently changing.
        maxLength={SPR_MAX_NEGATIVE + 2}
        onChange={(e) => {
          const v = e.target.value.replace(/[−–]/g, "-").replace(/\s+/g, " ").trimStart();
          if (SPR_ALLOWED_CHARS.test(v)) onChange(v);
        }}
        aria-describedby={`${id}-help`}
        aria-invalid={!!error}
        className="h-12 w-44 text-center font-mono text-xl"
      />
      <p id={`${id}-help`} className="text-sm text-muted-foreground">
        {error ? <span className="text-destructive">{t(`sprErrors.${error as Exclude<SprError, never>}`)}</span> : t("sprHelp")}
      </p>
      {value && !error && (
        <div className="text-sm">
          <span className="text-muted-foreground">{t("sprPreview")}: </span>
          {den != null ? (
            <span className="inline-flex flex-col items-center align-middle font-mono text-lg leading-tight">
              <span className="border-b border-foreground px-1">{num}</span>
              <span className="px-1">{den}</span>
            </span>
          ) : (
            <span className="font-mono text-lg">{value}</span>
          )}
        </div>
      )}
    </div>
  );
}
