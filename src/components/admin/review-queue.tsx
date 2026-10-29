"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CheckCheck } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { DOMAINS, getDomain } from "@/lib/taxonomy";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuestionTable, type QuestionRow } from "./question-table";
import { bulkQuestionMeta, bulkQuestionStatus, publishCleanInFilter } from "@/server/actions/admin/questions";

export function ReviewQueue({ rows }: { rows: QuestionRow[] }) {
  const t = useTranslations("admin.review");
  const te = useTranslations("enums");
  const tx = useTranslations("taxonomy");
  const c = useTranslations("common");
  const router = useRouter();
  const sp = useSearchParams();
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const [domainSkill, setDomainSkill] = useState("");

  const sections = [...new Set(rows.filter((r) => selected.includes(r.id)).map((r) => r.section))];
  const domainSkillOptions = sections.length === 1 ? DOMAINS.filter((d) => d.section === sections[0]).flatMap((d) => d.skills.map((s) => ({ value: `${d.key}|${s}`, label: `${tx(`domains.${d.key}`)} — ${tx(`skills.${s as "INFERENCES"}`)}` }))) : [];

  function done(res: { ok: boolean; data?: { updated: unknown; skipped?: unknown[] } | { updated: number }; error?: string }): void {
    if (!res.ok) {
      toast.error(c("unknownError"));
      return;
    }
    const data = res.data as { updated: string[] | number; skipped?: unknown[] };
    const updated = Array.isArray(data.updated) ? data.updated.length : data.updated;
    const skipped = data.skipped?.length ?? 0;
    toast.success(t("bulkDone", { updated, skipped }), skipped ? { description: t("skippedBlocking") } : undefined);
    setSelected([]);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-2">
        <span className="px-2 text-sm font-medium">{selected.length ? c("selected", { count: selected.length }) : t("bulk")}</span>
        <Button size="sm" disabled={pending || !selected.length} onClick={() => start(async () => done(await bulkQuestionStatus(selected, "PUBLISHED")))}>
          {t("bulkApprove")}
        </Button>
        <Button size="sm" variant="secondary" disabled={pending || !selected.length} onClick={() => start(async () => done(await bulkQuestionStatus(selected, "IN_REVIEW")))}>
          {t("bulkSendToReview")}
        </Button>
        <Select
          value=""
          disabled={pending || !selected.length}
          onValueChange={(d) => start(async () => done(await bulkQuestionMeta(selected, { difficulty: d })))}
        >
          <SelectTrigger size="sm" className="w-44" aria-label={t("bulkDifficulty")}>
            <SelectValue placeholder={t("bulkDifficulty")} />
          </SelectTrigger>
          <SelectContent>
            {(["EASY", "MEDIUM", "HARD"] as const).map((d) => (
              <SelectItem key={d} value={d}>
                {te(`difficulty.${d}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={domainSkill}
          disabled={pending || domainSkillOptions.length === 0}
          onValueChange={(v) => {
            setDomainSkill("");
            const [domain, skill] = v.split("|");
            if (domain && skill && getDomain(domain)) start(async () => done(await bulkQuestionMeta(selected, { domain, skill })));
          }}
        >
          <SelectTrigger size="sm" className="w-56" aria-label={t("bulkDomainSkill")}>
            <SelectValue placeholder={t("bulkDomainSkill")} />
          </SelectTrigger>
          <SelectContent>
            {domainSkillOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="ghost" disabled={pending || !selected.length} onClick={() => start(async () => done(await bulkQuestionStatus(selected, "RETIRED")))}>
          {t("bulkRetire")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="ms-auto"
          disabled={pending || rows.length === 0}
          onClick={() => start(async () => done(await publishCleanInFilter(Object.fromEntries(sp.entries()))))}
        >
          <CheckCheck aria-hidden /> {t("bulkApproveClean")}
        </Button>
      </div>
      <QuestionTable rows={rows} selectable selected={selected} onSelectedChange={setSelected} />
    </div>
  );
}
