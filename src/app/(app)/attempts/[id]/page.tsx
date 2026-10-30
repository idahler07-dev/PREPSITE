import { notFound } from "next/navigation";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { CheckCircle2, XCircle, MinusCircle, Bookmark } from "lucide-react";
import { redirect, Link } from "@/i18n/navigation";
import { requireUser } from "@/server/auth/session";
import { getResults } from "@/server/attempts/service";
import { HttpError } from "@/server/http";
import { Container, PageHeader } from "@/components/layout/page-header";
import { Odometer } from "@/components/motion/odometer";
import { Celebration } from "@/components/mascot/celebrate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResultQuestion } from "@/components/practice/result-question";
import { formatDuration } from "@/lib/format";
import { aiAvailable } from "@/server/ai/client";
import { db } from "@/lib/db";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/attempts/${id}`);
  const t = await getTranslations("results");
  const tx = await getTranslations("taxonomy");
  const te = await getTranslations("enums");
  const tt = await getTranslations("test");
  const c = await getTranslations("common");
  const format = await getFormatter();
  let results;
  try {
    results = await getResults(id, user.id);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
  if (!results) redirect({ href: `/test/${id}`, locale: await getLocale() });
  const r = results!;
  const notes = new Map(
    (await db.questionNote.findMany({ where: { userId: user.id, questionId: { in: r.items.map((i) => i.questionId) } } })).map((n) => [n.questionId, { bookmarked: n.bookmarked, note: n.note }]),
  );
  const totalMs = r.items.reduce((s, i) => s + i.timeSpentMs, 0);
  const accuracy = r.total ? Math.round((r.correct / r.total) * 100) : 0;
  const byDomain = new Map<string, { correct: number; total: number }>();
  for (const i of r.items) {
    const d = byDomain.get(i.domain) ?? { correct: 0, total: 0 };
    d.total++;
    if (i.isCorrect) d.correct++;
    byDomain.set(i.domain, d);
  }
  const isTest = r.kind === "MOCK" || r.kind === "SECTION" || r.kind === "MODULE";
  const title = isTest ? String(r.config.mockTitle ?? t("testTitle")) : t("drillTitle");
  const moduleLabel = (index: number) => {
    const m = r.modules.find((x) => x.index === index);
    if (!m?.section) return null;
    const base = tt("moduleTitle", { section: tx(`sections.${m.section}`), module: m.moduleNumber ?? 1 });
    return m.moduleNumber === 2 && (m.variant === "easier" || m.variant === "harder") ? `${base} · ${t(`variant.${m.variant}`)}` : base;
  };
  // Celebrate only right after finishing, not when coming back to old results.
  const justFinished = !!r.completedAt && Date.now() - r.completedAt.getTime() < 10 * 60_000;
  const dur = (ms: number) => formatDuration(ms, (min, sec) => (min ? c("durationMinSec", { min, sec }) : c("secondsShort", { count: sec })));

  return (
    <Container className="max-w-5xl space-y-6">
      <PageHeader
        title={title}
        description={r.completedAt ? t("completedAt", { date: format.dateTime(r.completedAt, { dateStyle: "medium", timeStyle: "short" }) }) : undefined}
        actions={
          <>
            {r.correct < r.total && (
              <Button asChild variant="secondary">
                <Link href="/review">{t("reviewMistakes")}</Link>
              </Button>
            )}
            <Button asChild>
              <Link href="/practice">{t("practiceAgain")}</Link>
            </Button>
          </>
        }
      />
      {r.scores && (
        <Card className="overflow-visible border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">{t("estimate.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("estimate.disclaimer")}</p>
          </CardHeader>
          <CardContent className="grid items-center gap-6 sm:grid-cols-3">
            {justFinished && <Celebration className="sm:col-span-3" />}
            {r.scores.total && (
              <div>
                <p className="text-sm text-muted-foreground">{t("estimate.total")}</p>
                <p className="text-[4rem] leading-none font-bold">
                  <Odometer value={r.scores.total.score} className="font-mono" />
                </p>
                <p className="text-sm text-muted-foreground">{t("estimate.range", { low: r.scores.total.low, high: r.scores.total.high })}</p>
              </div>
            )}
            {r.scores.sections.map((s) => (
              <div key={s.section}>
                <p className="text-sm text-muted-foreground">{tx(`sections.${s.section}`)}</p>
                <p className="text-[2rem] leading-none font-bold">
                  <Odometer value={s.score} className="font-mono" />
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("estimate.range", { low: s.low, high: s.high })} · {t("estimate.correct", { correct: s.correct, total: s.total })}
                </p>
                <p className="text-xs text-muted-foreground">{t(`estimate.route.${s.route}`)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: t("score", { correct: r.correct, total: r.total }), value: `${r.correct}/${r.total}` },
          { label: t("accuracy"), value: `${accuracy}%` },
          { label: t("timeSpent"), value: dur(totalMs) },
          { label: t("avgTime"), value: dur(r.total ? totalMs / r.total : 0) },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold tabular-nums">{s.value}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("byDomain")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {[...byDomain.entries()].map(([domain, d]) => {
              const pct = Math.round((d.correct / d.total) * 100);
              return (
                <li key={domain} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{tx(`domains.${domain as "ALGEBRA"}`)}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {d.correct}/{d.total}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${pct}%`}>
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("questions")}</h2>
        <ol className="space-y-3">
          {r.items.map((i, n) => {
            const Icon = !i.answer ? MinusCircle : i.isCorrect ? CheckCircle2 : XCircle;
            const heading = isTest && (n === 0 || r.items[n - 1]!.moduleIndex !== i.moduleIndex) ? moduleLabel(i.moduleIndex) : null;
            return (
              <li key={`${i.moduleIndex}-${i.position}`} className="rounded-lg border p-4">
                {heading && <h3 className="-mt-1 mb-3 border-b pb-2 font-semibold">{heading}</h3>}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="font-semibold tabular-nums">{n + 1}</span>
                  <Icon
                    className={`size-5 ${!i.answer ? "text-muted-foreground" : i.isCorrect ? "text-success" : "text-destructive"}`}
                    aria-label={!i.answer ? tt("unanswered") : i.isCorrect ? tt("correct") : tt("incorrect")}
                  />
                  <span className="text-muted-foreground">{tx(`skills.${i.skill as "INFERENCES"}`)}</span>
                  <span className="text-muted-foreground">{te(`difficulty.${i.difficulty}`)}</span>
                  {i.flagged && <Bookmark className="size-4 fill-flag text-flag" aria-label={t("flagged")} />}
                  <span className="ms-auto flex flex-wrap gap-x-4 text-muted-foreground">
                    <span>
                      {t("columns.yourAnswer")}: <strong className="text-foreground">{i.answer ?? "—"}</strong>
                    </span>
                    <span>
                      {t("columns.correctAnswer")}: <strong className="text-foreground">{i.feedback.correctAnswers.join(", ")}</strong>
                    </span>
                    <span>
                      {t("columns.time")}: {dur(i.timeSpentMs)}
                    </span>
                  </span>
                </div>
                <ResultQuestion
                  attemptId={r.id}
                  questionId={i.questionId}
                  type={i.type}
                  passageHtml={i.passageHtml}
                  stemHtml={i.stemHtml}
                  choices={i.choices}
                  answer={i.answer}
                  correctAnswers={i.feedback.correctAnswers}
                  explanationHtml={i.feedback.explanationHtml}
                  rationaleHtml={i.feedback.rationaleHtml}
                  aiEnabled={aiAvailable()}
                  note={notes.get(i.questionId)}
                />
              </li>
            );
          })}
        </ol>
      </section>
    </Container>
  );
}
