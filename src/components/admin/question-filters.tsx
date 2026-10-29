"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { DOMAINS, getDomain } from "@/lib/taxonomy";
import { ALL_FLAGS } from "@/lib/questions/flags";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Opt = { value: string; label: string };

export function QuestionFilters({ sources, show = ["status", "section", "domain", "skill", "difficulty", "source", "flag", "origin"] }: { sources: Opt[]; show?: string[] }) {
  const t = useTranslations("admin.questions");
  const c = useTranslations("common");
  const tx = useTranslations("taxonomy");
  const te = useTranslations("enums");
  const tf = useTranslations("flags");
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  function update(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  const section = sp.get("section") ?? "";
  const domain = sp.get("domain") ?? "";
  const domainOpts = DOMAINS.filter((d) => !section || d.section === section).map((d) => ({ value: d.key, label: tx(`domains.${d.key}`) }));
  const skillOpts = (domain ? (getDomain(domain)?.skills ?? []) : DOMAINS.filter((d) => !section || d.section === section).flatMap((d) => [...d.skills])).map(
    (s) => ({ value: s, label: tx(`skills.${s as "INFERENCES"}`) }),
  );

  const selects: { key: string; label: string; options: Opt[]; any: string }[] = [
    { key: "status", label: t("status"), any: c("all"), options: (["DRAFT", "IN_REVIEW", "PUBLISHED", "RETIRED"] as const).map((s) => ({ value: s, label: te(`status.${s}`) })) },
    { key: "section", label: t("section"), any: c("all"), options: (["RW", "MATH"] as const).map((s) => ({ value: s, label: tx(`sections.${s}`) })) },
    { key: "domain", label: t("domain"), any: c("all"), options: domainOpts },
    { key: "skill", label: t("skill"), any: c("all"), options: skillOpts },
    { key: "difficulty", label: t("difficulty"), any: c("all"), options: (["EASY", "MEDIUM", "HARD"] as const).map((s) => ({ value: s, label: te(`difficulty.${s}`) })) },
    { key: "source", label: t("source"), any: t("anySource"), options: sources },
    { key: "flag", label: t("flag"), any: t("anyFlag"), options: [{ value: "NONE", label: t("noFlags") }, ...ALL_FLAGS.map((f) => ({ value: f, label: tf(`${f}.label`) }))] },
    { key: "origin", label: t("origin"), any: c("all"), options: (["IMPORTED", "AI_DRAFTED", "MANUAL"] as const).map((s) => ({ value: s, label: te(`origin.${s}`) })) },
  ].filter((s) => show.includes(s.key));

  const active = [...sp.keys()].some((k) => k !== "page");
  return (
    <div className="mb-4 space-y-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: q.trim() || undefined });
        }}
        role="search"
      >
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} aria-label={c("search")} className="max-w-sm" />
        <Button type="submit" variant="secondary">
          <Search aria-hidden /> {c("search")}
        </Button>
        {active && (
          <Button type="button" variant="ghost" onClick={() => router.push(pathname)}>
            <X aria-hidden /> {c("clearFilters")}
          </Button>
        )}
      </form>
      <div className="flex flex-wrap gap-2">
        {selects.map((s) => (
          <Select
            key={s.key}
            value={sp.get(s.key) ?? "__any"}
            onValueChange={(v) =>
              update({
                [s.key]: v === "__any" ? undefined : v,
                ...(s.key === "section" ? { domain: undefined, skill: undefined } : {}),
                ...(s.key === "domain" ? { skill: undefined } : {}),
              })
            }
          >
            <SelectTrigger size="sm" className="max-w-56 min-w-32" aria-label={s.label}>
              <SelectValue placeholder={s.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__any">
                {s.label}: {s.any}
              </SelectItem>
              {s.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>
    </div>
  );
}
