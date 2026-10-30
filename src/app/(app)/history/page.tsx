import { getFormatter, getTranslations } from "next-intl/server";
import { z } from "zod";
import { ArrowRight, Play } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/server/auth/session";
import { Link } from "@/i18n/navigation";
import { Container, PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/admin/pagination";
import { cn } from "@/lib/utils";

const PAGE = 25;

export async function generateMetadata() {
  const t = await getTranslations("history");
  return { title: t("title") };
}

function duration(ms: number) {
  const s = Math.round(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}` : `${m}:${String(s % 60).padStart(2, "0")}`;
}

function AccuracyBar({ percent }: { percent: number }) {
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-surface-2" aria-hidden>
      <span className={cn("block h-full rounded-full", percent >= 70 ? "bg-correct" : percent >= 40 ? "bg-primary" : "bg-accent")} style={{ width: `${percent}%` }} />
    </span>
  );
}

/** Every attempt: cards on phones (no sideways scrolling), a table from tablets up. Open attempts can be resumed. */
export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser("/history");
  const t = await getTranslations("history");
  const format = await getFormatter();
  const page = z.coerce.number().int().min(1).catch(1).parse((await searchParams).page);
  const [total, attempts] = await Promise.all([
    db.attempt.count({ where: { userId: user.id } }),
    db.attempt.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      select: { id: true, kind: true, status: true, startedAt: true, correctCount: true, totalCount: true, modules: { select: { responses: { select: { timeSpentMs: true } } } } },
    }),
  ]);
  const rows = attempts.map((a) => {
    const responses = a.modules.flatMap((m) => m.responses);
    const done = a.status === "COMPLETED";
    const percent = done && a.totalCount ? Math.round(((a.correctCount ?? 0) / a.totalCount) * 100) : null;
    return {
      ...a,
      questions: responses.length,
      timeMs: responses.reduce((s, r) => s + r.timeSpentMs, 0),
      percent,
      score: done ? `${a.correctCount ?? 0}/${a.totalCount ?? 0}` : null,
      // The test screen is a full page load (its security policy allows the calculator).
      href: a.status === "IN_PROGRESS" ? `/test/${a.id}` : `/attempts/${a.id}`,
      date: format.dateTime(a.startedAt, { dateStyle: "medium", timeStyle: "short" }),
    };
  });

  const action = (r: (typeof rows)[number]) =>
    r.status === "IN_PROGRESS" ? (
      <Button asChild size="sm">
        <a href={r.href}>
          <Play aria-hidden /> {t("resume")}
        </a>
      </Button>
    ) : (
      <Button asChild size="sm" variant="ghost">
        <Link href={r.href}>
          {t("view")} <ArrowRight aria-hidden />
        </Link>
      </Button>
    );

  const inProgress = <span className="inline-flex items-center rounded-full bg-flagged/20 px-2.5 py-0.5 text-xs font-medium text-warning-ink">{t("statuses.IN_PROGRESS")}</span>;

  return (
    <Container className="max-w-5xl">
      <PageHeader title={t("title")} description={t("description")} />
      {rows.length === 0 ? (
        <EmptyState
          pose="point"
          body={t("empty")}
          action={
            <Button asChild>
              <Link href="/practice">{t("emptyCta")}</Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Phones: cards */}
          <ul className="space-y-3 md:hidden">
            {rows.map((r) => (
              <li key={r.id} className="space-y-3 rounded-2xl border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{t(`kinds.${r.kind}`)}</p>
                    <p className="text-xs text-muted-foreground">{r.date}</p>
                  </div>
                  {r.score ? <p className="font-mono text-lg font-semibold tabular-nums">{r.score}</p> : inProgress}
                </div>
                {r.percent != null && (
                  <div className="space-y-1">
                    <AccuracyBar percent={r.percent} />
                    <p className="text-xs text-muted-foreground">{t("accuracyLabel", { percent: r.percent })}</p>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>
                    {t("columns.questions")}: <span className="font-mono text-foreground tabular-nums">{r.questions}</span> · {t("columns.time")}:{" "}
                    <span className="font-mono text-foreground tabular-nums">{duration(r.timeMs)}</span>
                  </span>
                  {action(r)}
                </div>
              </li>
            ))}
          </ul>

          {/* Tablets and up: table */}
          <div className="hidden overflow-hidden rounded-2xl border bg-surface md:block">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2.5 text-start font-medium">
                    {t("columns.date")}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-start font-medium">
                    {t("columns.type")}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-end font-medium">
                    {t("columns.questions")}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-end font-medium">
                    {t("columns.score")}
                  </th>
                  <th scope="col" className="w-40 px-3 py-2.5 text-start font-medium">
                    {t("columns.accuracy")}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-end font-medium">
                    {t("columns.time")}
                  </th>
                  <th scope="col" className="px-4 py-2.5">
                    <span className="sr-only">{t("columns.status")}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-surface-2/60">
                    <td className="px-4 py-3 whitespace-nowrap">{r.date}</td>
                    <td className="px-3 py-3">{t(`kinds.${r.kind}`)}</td>
                    <td className="px-3 py-3 text-end font-mono tabular-nums">{r.questions}</td>
                    <td className="px-3 py-3 text-end font-mono tabular-nums">{r.score ?? inProgress}</td>
                    <td className="px-3 py-3">
                      {r.percent != null && (
                        <span className="flex items-center gap-2">
                          <AccuracyBar percent={r.percent} />
                          <span className="w-9 shrink-0 text-end font-mono text-xs tabular-nums">{r.percent}%</span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-end font-mono text-muted-foreground tabular-nums">{duration(r.timeMs)}</td>
                    <td className="px-4 py-3 text-end">{action(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <Pagination page={page} pages={Math.max(1, Math.ceil(total / PAGE))} total={total} pageSize={PAGE} />
    </Container>
  );
}
