"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronDown, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { generateMockTest, startMockTest } from "@/server/actions/mocks";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Scope = "full" | "RW" | "MATH" | "module-RW" | "module-MATH";

function useStart() {
  const t = useTranslations("mocks");
  const tb = useTranslations("billing");
  const router = useRouter();
  const [pending, start] = useTransition();
  const go = (fn: () => Promise<{ ok: true; id: string } | { ok: false; error: string }>) =>
    start(async () => {
      const res = await fn();
      if (res.ok) router.push(`/test/${res.id}`);
      else if (res.error === "TEST_LIMIT") toast.error(tb("limits.tests"), { action: { label: tb("limits.upgrade"), onClick: () => router.push("/pricing") } });
      else toast.error(t(`errors.${res.error === "NOT_ENOUGH_QUESTIONS" || res.error === "RATE_LIMITED" ? res.error : "other"}`));
    });
  return { pending, go };
}

/** Start a published test: the full test, one section, or module 1 of a section. */
export function StartMockMenu({ mockTestId, sections }: { mockTestId: string; sections: ("RW" | "MATH")[] }) {
  const t = useTranslations("mocks");
  const tx = useTranslations("taxonomy");
  const { pending, go } = useStart();
  const startWith = (scope: Scope) => go(() => startMockTest({ mockTestId, scope }));
  return (
    <div className="flex">
      <Button className="rounded-e-none" disabled={pending} onClick={() => startWith(sections.length === 2 ? "full" : sections[0]!)}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        {sections.length === 2 ? t("startFull") : t("startSection", { section: tx(`sections.${sections[0]!}`) })}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="rounded-s-none border-s border-primary-foreground/30 px-2" disabled={pending} aria-label={t("moreOptions")}>
            <ChevronDown aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {sections.length === 2 && (
            <>
              <DropdownMenuLabel>{t("oneSection")}</DropdownMenuLabel>
              {sections.map((s) => (
                <DropdownMenuItem key={s} onSelect={() => startWith(s)}>
                  {tx(`sections.${s}`)}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuLabel>{t("oneModule")}</DropdownMenuLabel>
          {sections.map((s) => (
            <DropdownMenuItem key={s} onSelect={() => startWith(`module-${s}`)}>
              {t("moduleOf", { section: tx(`sections.${s}`) })}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** Build a new test from questions this student hasn't seen. */
export function GenerateMockForm() {
  const t = useTranslations("mocks");
  const tx = useTranslations("taxonomy");
  const { pending, go } = useStart();
  const [choice, setChoice] = useState<"both" | "RW" | "MATH">("both");
  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        go(() => generateMockTest({ sections: choice === "both" ? ["RW", "MATH"] : [choice] }));
      }}
    >
      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-1 text-sm font-medium">{t("generateWhat")}</legend>
        {(["both", "RW", "MATH"] as const).map((v) => (
          <label key={v} className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
            <input type="radio" name="sections" value={v} checked={choice === v} onChange={() => setChoice(v)} className="size-4" />
            {v === "both" ? t("bothSections") : tx(`sections.${v}`)}
          </label>
        ))}
      </fieldset>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />} {t("generate")}
      </Button>
    </form>
  );
}
