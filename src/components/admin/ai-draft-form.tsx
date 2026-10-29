"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { DOMAINS } from "@/lib/taxonomy";
import { startAiDrafts } from "@/server/actions/admin/ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AiDraftForm({ maxCount, defaultPrefix }: { maxCount: number; defaultPrefix: { RW: string; MATH: string } }) {
  const t = useTranslations("admin.aiDrafts");
  const tx = useTranslations("taxonomy");
  const te = useTranslations("enums");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [section, setSection] = useState<"RW" | "MATH">("MATH");
  const domains = useMemo(() => DOMAINS.filter((d) => d.section === section), [section]);
  const [domain, setDomain] = useState<string>(domains[0]!.key);
  const skills = DOMAINS.find((d) => d.key === domain)?.skills ?? [];
  const [skill, setSkill] = useState<string>(skills[0]!);
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [count, setCount] = useState(5);
  const [useStyle, setUseStyle] = useState(true);
  const [prefix, setPrefix] = useState(defaultPrefix.MATH);

  const changeSection = (next: "RW" | "MATH") => {
    const first = DOMAINS.find((d) => d.section === next)!;
    setSection(next);
    setDomain(first.key);
    setSkill(first.skills[0]!);
    setPrefix(defaultPrefix[next]);
  };

  return (
    <form
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await startAiDrafts({ section, domain, skill, difficulty, count, useStyle, codePrefix: prefix });
          if (res.ok) {
            toast.success(t("started"));
            router.refresh();
          } else toast.error(t(`errors.${res.error === "AI_UNAVAILABLE" || res.error === "RATE_LIMITED" ? res.error : "other"}`));
        });
      }}
    >
      <div className="space-y-2">
        <Label>{t("section")}</Label>
        <Select value={section} onValueChange={(v) => changeSection(v as "RW")}>
          <SelectTrigger className="w-full" aria-label={t("section")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RW">{tx("sections.RW")}</SelectItem>
            <SelectItem value="MATH">{tx("sections.MATH")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t("domain")}</Label>
        <Select
          value={domain}
          onValueChange={(v) => {
            setDomain(v);
            setSkill(DOMAINS.find((d) => d.key === v)!.skills[0]!);
          }}
        >
          <SelectTrigger className="w-full" aria-label={t("domain")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {domains.map((d) => (
              <SelectItem key={d.key} value={d.key}>
                {tx(`domains.${d.key as "ALGEBRA"}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t("skill")}</Label>
        <Select value={skill} onValueChange={setSkill}>
          <SelectTrigger className="w-full" aria-label={t("skill")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {skills.map((s) => (
              <SelectItem key={s} value={s}>
                {tx(`skills.${s as "INFERENCES"}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t("difficulty")}</Label>
        <Select value={difficulty} onValueChange={(v) => setDifficulty(v as "EASY")}>
          <SelectTrigger className="w-full" aria-label={t("difficulty")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["EASY", "MEDIUM", "HARD"] as const).map((d) => (
              <SelectItem key={d} value={d}>
                {te(`difficulty.${d}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ai-count">{t("count", { max: maxCount })}</Label>
        <Input id="ai-count" type="number" min={1} max={maxCount} value={count} onChange={(e) => setCount(Math.max(1, Math.min(maxCount, Number(e.target.value) || 1)))} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ai-prefix">{t("codePrefix")}</Label>
        <Input id="ai-prefix" value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} className="font-mono" maxLength={20} />
      </div>
      <label className="flex items-start gap-2 text-sm sm:col-span-2 lg:col-span-3">
        <input type="checkbox" className="mt-0.5 size-4" checked={useStyle} onChange={(e) => setUseStyle(e.target.checked)} />
        <span>{t("useStyle")}</span>
      </label>
      <div className="sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />} {t("submit")}
        </Button>
      </div>
    </form>
  );
}

/** Refreshes the page every few seconds while a batch is still running. */
export function RefreshWhileRunning({ running }: { running: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(id);
  }, [running, router]);
  return null;
}
