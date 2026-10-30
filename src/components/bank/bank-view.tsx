"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Bookmark, CheckCircle2, ChevronLeft, ChevronRight, Circle, Loader2, Play, RotateCcw, Search, SlidersHorizontal, XCircle } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { EmptyState } from "@/components/layout/empty-state";
import { SpringBar } from "@/components/motion/progress";
import { practiceFromBank } from "@/server/actions/bank";
import { openTest } from "@/lib/open-test";
import { DOMAINS } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import type { BankFilters, BankRow } from "@/server/bank/query";

const DIFFS = ["EASY", "MEDIUM", "HARD"] as const;
const STATUSES = ["unattempted", "correct", "incorrect", "flagged"] as const;
const SORTS = ["difficulty", "newest", "missed"] as const;
const DOT = { EASY: "bg-correct", MEDIUM: "bg-flagged", HARD: "bg-danger" } as const;

interface Props {
  filters: BankFilters;
  page: { total: number; pages: number; rows: BankRow[] };
  counts: Record<(typeof DIFFS)[number], number>;
  progress: { domain: string; total: number; attempted: number; correct: number }[];
}

function formatTime(ms: number | null) {
  if (ms == null) return null;
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** A pill-shaped filter option. */
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
        active ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  );
}

function StatusIcon({ row }: { row: BankRow }) {
  const t = useTranslations("bank.statuses");
  const Icon = row.status === "correct" ? CheckCircle2 : row.status === "incorrect" ? XCircle : Circle;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon
        className={cn("size-[18px]", row.status === "correct" ? "text-correct-ink" : row.status === "incorrect" ? "text-danger-ink" : "text-muted-foreground/50")}
        aria-label={t(row.status)}
        role="img"
      />
      {row.flagged && <Bookmark className="size-4 fill-flagged text-warning-ink" aria-label={t("flagged")} role="img" />}
    </span>
  );
}

export function BankView({ filters, page, counts, progress }: Props) {
  const t = useTranslations("bank");
  const tx = useTranslations("taxonomy");
  const te = useTranslations("enums.difficulty");
  const tb = useTranslations("billing");
  const tp = useTranslations("practice");
  const c = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startNav] = useTransition();
  const [starting, startPractice] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [q, setQ] = useState(filters.q ?? "");

  const domains = useMemo(() => DOMAINS.filter((d) => d.section === filters.section), [filters.section]);
  const skills = filters.domain ? (domains.find((d) => d.key === filters.domain)?.skills ?? []) : [];
  const activeCount = [filters.domain, filters.skill, filters.difficulty, filters.status, filters.q].filter(Boolean).length;
  const query = params.toString();
  const returnTo = `${pathname}${query ? `?${query}` : ""}`;

  function setParams(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!("page" in patch)) next.delete("page");
    const s = next.toString();
    startNav(() => router.replace(`${pathname}${s ? `?${s}` : ""}`, { scroll: false }));
  }

  // Search as you type (debounced).
  useEffect(() => {
    if ((filters.q ?? "") === q.trim()) return;
    const id = setTimeout(() => setParams({ q: q.trim() || undefined }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function practice(mode: "one" | "these" | "mistakes", questionId?: string) {
    setBusyId(questionId ?? mode);
    startPractice(async () => {
      const res = await practiceFromBank({ mode, questionId, filters: Object.fromEntries(params.entries()), returnTo });
      if (res.ok) {
        openTest(res.id);
        return;
      }
      setBusyId(null);
      if (res.error === "DAILY_LIMIT") toast.error(tb("limits.daily", { left: Number(res.message) || 0 }), { action: { label: tb("limits.upgrade"), onClick: () => router.push("/pricing") } });
      else if (res.error === "NO_QUESTIONS") toast.info(mode === "mistakes" ? t("noMistakes") : tp("noQuestions"));
      else toast.error(c("unknownError"));
    });
  }

  const filterGroups = (
    <div className="space-y-6">
      <Group label={t("domain")}>
        <Chip active={!filters.domain} onClick={() => setParams({ domain: undefined, skill: undefined })}>
          {t("allDomains")}
        </Chip>
        {domains.map((d) => (
          <Chip key={d.key} active={filters.domain === d.key} onClick={() => setParams({ domain: d.key, skill: undefined })}>
            {tx(`domains.${d.key as "ALGEBRA"}`)}
          </Chip>
        ))}
      </Group>
      {skills.length > 0 && (
        <Group label={t("skill")}>
          <Chip active={!filters.skill} onClick={() => setParams({ skill: undefined })}>
            {t("allSkills")}
          </Chip>
          {skills.map((s) => (
            <Chip key={s} active={filters.skill === s} onClick={() => setParams({ skill: s })}>
              {tx(`skills.${s as "INFERENCES"}`)}
            </Chip>
          ))}
        </Group>
      )}
      <Group label={t("difficulty")}>
        <Chip active={!filters.difficulty} onClick={() => setParams({ difficulty: undefined })}>
          {t("allDifficulties")}
        </Chip>
        {DIFFS.map((d) => (
          <Chip key={d} active={filters.difficulty === d} onClick={() => setParams({ difficulty: d })}>
            <span className={cn("size-2 rounded-full", DOT[d])} aria-hidden />
            {te(d)}
            <span className="font-mono text-[11px] opacity-70 tabular-nums">{counts[d]}</span>
          </Chip>
        ))}
      </Group>
      <Group label={t("status")}>
        <Chip active={!filters.status} onClick={() => setParams({ status: undefined })}>
          {t("allStatuses")}
        </Chip>
        {STATUSES.map((s) => (
          <Chip key={s} active={filters.status === s} onClick={() => setParams({ status: s })}>
            {t(`statuses.${s}`)}
          </Chip>
        ))}
      </Group>
      {activeCount > 0 && (
        <Button variant="ghost" size="sm" className="-ms-2" onClick={() => (setQ(""), setParams({ domain: undefined, skill: undefined, difficulty: undefined, status: undefined, q: undefined }))}>
          <RotateCcw aria-hidden /> {t("clear")}
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Section tabs */}
      <div role="tablist" aria-label={t("title")} className="inline-flex rounded-full border bg-surface p-1">
        {(["RW", "MATH"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={filters.section === s}
            onClick={() => setParams({ section: s, domain: undefined, skill: undefined })}
            className={cn(
              "h-9 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
              filters.section === s ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`sections.${s}`)}
          </button>
        ))}
      </div>

      {/* Per-domain progress */}
      <ul className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {progress.map((p) => (
          <li key={p.domain}>
            <button
              type="button"
              onClick={() => setParams({ domain: filters.domain === p.domain ? undefined : p.domain, skill: undefined })}
              aria-pressed={filters.domain === p.domain}
              aria-label={t("progressLabel", { domain: tx(`domains.${p.domain as "ALGEBRA"}`), attempted: p.attempted, total: p.total, correct: p.correct })}
              className={cn(
                "h-full w-full space-y-2 rounded-2xl border bg-surface p-3 text-start transition-colors hover:border-primary/40 sm:p-4 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
                filters.domain === p.domain && "border-primary ring-1 ring-primary",
              )}
            >
              <p className="line-clamp-2 text-xs font-semibold sm:truncate sm:text-sm">{tx(`domains.${p.domain as "ALGEBRA"}`)}</p>
              <SpringBar value={p.total ? (p.attempted / p.total) * 100 : 0} label={t("progressLabel", { domain: tx(`domains.${p.domain as "ALGEBRA"}`), attempted: p.attempted, total: p.total, correct: p.correct })} className="h-1.5" />
              <p className="text-xs text-muted-foreground tabular-nums">{t("progress", { attempted: p.attempted, correct: p.correct, total: p.total })}</p>
            </button>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="hidden lg:block" aria-label={t("filters")}>
          {filterGroups}
        </aside>

        <div className="min-w-0 space-y-4">
          {/* Search, sort, filters (phones) and bulk actions */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-0 flex-1 basis-56">
              <span className="sr-only">{t("search")}</span>
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("search")}
                maxLength={80}
                className="h-10 w-full rounded-full border bg-surface ps-9 pe-4 text-sm outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/30"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span className="sr-only sm:not-sr-only sm:text-muted-foreground">{t("sort")}</span>
              <select
                value={filters.sort}
                onChange={(e) => setParams({ sort: e.target.value === "difficulty" ? undefined : e.target.value })}
                className="h-10 rounded-full border bg-surface px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/30"
              >
                {SORTS.map((s) => (
                  <option key={s} value={s}>
                    {t(`sorts.${s}`)}
                  </option>
                ))}
              </select>
            </label>
            <Button variant="outline" className="h-10 rounded-full lg:hidden" onClick={() => setSheet(true)}>
              <SlidersHorizontal aria-hidden /> {t("filters")}
              {activeCount > 0 && <span className="rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground tabular-nums">{activeCount}</span>}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <p className="me-auto text-sm text-muted-foreground tabular-nums" aria-live="polite">
              {pending ? <Loader2 className="inline size-4 animate-spin" aria-hidden /> : null} {t("count", { count: page.total })}
            </p>
            <Button size="sm" onClick={() => practice("these")} disabled={starting || page.total === 0} title={t("practiceHint")}>
              {busyId === "these" ? <Loader2 className="animate-spin" aria-hidden /> : <Play aria-hidden />} {t("practiceThese")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => practice("mistakes")} disabled={starting}>
              {busyId === "mistakes" ? <Loader2 className="animate-spin" aria-hidden /> : <RotateCcw aria-hidden />} {t("practiceMistakes")}
            </Button>
          </div>

          <div className={cn("transition-opacity duration-200", pending && "opacity-60")}>
            {page.rows.length === 0 ? (
              <EmptyState pose="confused" title={t("empty.title")} body={t("empty.body")} />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-hidden rounded-2xl border bg-surface md:block">
                  <table className="w-full table-fixed text-sm">
                    <thead className="bg-surface-2 text-xs text-muted-foreground">
                      <tr className="text-start">
                        <th scope="col" className="w-40 px-4 py-2.5 text-start font-medium">
                          {t("columns.id")}
                        </th>
                        <th scope="col" className="w-48 px-3 py-2.5 text-start font-medium">
                          {t("columns.skill")}
                        </th>
                        <th scope="col" className="w-28 px-3 py-2.5 text-start font-medium">
                          {t("columns.difficulty")}
                        </th>
                        <th scope="col" className="px-3 py-2.5 text-start font-medium">
                          {t("columns.question")}
                        </th>
                        <th scope="col" className="w-20 px-3 py-2.5 text-start font-medium">
                          {t("columns.status")}
                        </th>
                        <th scope="col" className="w-24 px-4 py-2.5 text-end font-medium">
                          {t("columns.time")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {page.rows.map((r) => (
                        <tr key={r.id} className="group cursor-pointer transition-colors hover:bg-primary-soft/40" onClick={() => practice("one", r.id)}>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={(e) => (e.stopPropagation(), practice("one", r.id))}
                              aria-label={t("open", { id: r.code })}
                              className="inline-flex items-center gap-1.5 rounded font-mono text-xs font-medium whitespace-nowrap text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
                            >
                              {busyId === r.id && <Loader2 className="size-3 animate-spin" aria-hidden />}
                              {r.code}
                            </button>
                          </td>
                          <td className="truncate px-3 py-3 text-muted-foreground">{tx(`skills.${r.skill as "INFERENCES"}`)}</td>
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                              <span className={cn("size-2 rounded-full", DOT[r.difficulty])} aria-hidden />
                              {te(r.difficulty)}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <p className="line-clamp-2">{r.preview}</p>
                          </td>
                          <td className="px-3 py-3">
                            <StatusIcon row={r} />
                          </td>
                          <td className="px-4 py-3 text-end font-mono text-xs text-muted-foreground tabular-nums">{formatTime(r.lastTimeMs) ?? "–"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Phone cards */}
                <ul className="space-y-2 md:hidden">
                  {page.rows.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => practice("one", r.id)}
                        aria-label={t("open", { id: r.code })}
                        className="w-full space-y-2 rounded-2xl border bg-surface p-4 text-start transition-colors active:bg-primary-soft/40"
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-xs font-medium text-primary">{r.code}</span>
                          <span className="inline-flex items-center gap-1 text-xs font-medium">
                            <span className={cn("size-2 rounded-full", DOT[r.difficulty])} aria-hidden />
                            {te(r.difficulty)}
                          </span>
                          <span className="ms-auto flex items-center gap-2">
                            {formatTime(r.lastTimeMs) && <span className="font-mono text-xs text-muted-foreground tabular-nums">{formatTime(r.lastTimeMs)}</span>}
                            {busyId === r.id ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <StatusIcon row={r} />}
                          </span>
                        </span>
                        <span className="block text-xs text-muted-foreground">{tx(`skills.${r.skill as "INFERENCES"}`)}</span>
                        <span className="line-clamp-2 block text-sm">{r.preview}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {page.pages > 1 && (
            <nav className="flex items-center justify-between gap-2" aria-label={t("pageOf", { page: filters.page, pages: page.pages })}>
              <Button variant="outline" size="sm" disabled={filters.page <= 1} onClick={() => setParams({ page: filters.page > 2 ? String(filters.page - 1) : undefined })}>
                <ChevronLeft aria-hidden /> {t("previous")}
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums">{t("pageOf", { page: filters.page, pages: page.pages })}</span>
              <Button variant="outline" size="sm" disabled={filters.page >= page.pages} onClick={() => setParams({ page: String(filters.page + 1) })}>
                {t("next")} <ChevronRight aria-hidden />
              </Button>
            </nav>
          )}
        </div>
      </div>

      <MobileSheet open={sheet} onOpenChange={setSheet} title={t("filters")}>
        <div className="space-y-6 px-2 pb-2">
          {filterGroups}
          <Button className="w-full" onClick={() => setSheet(false)}>
            {t("showResults", { count: page.total })}
          </Button>
        </div>
      </MobileSheet>
    </div>
  );
}

