import { notFound } from "next/navigation";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { CheckCircle2, XCircle, MinusCircle, Bookmark } from "lucide-react";
import { redirect, Link } from "@/i18n/navigation";
import { requireUser } from "@/server/auth/session";
import { getResults } from "@/server/attempts/service";
import { HttpError } from "@/server/http";
import { Container, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResultQuestion } from "@/components/practice/result-question";
import { formatDuration } from "@/lib/format";

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
  const totalMs = r.items.reduce((s, i) => s + i.timeSpentMs, 0);
  const accuracy = r.total ? Math.round((r.correct / r.total) * 100) : 0;
  const byDomain = new Map<string, { correct: number; total: number }>();
  for (const i of r.items) {
    const d = byDomain.get(i.domain) ?? { correct: 0, total: 0 };
    d.total++;
    if (i.isCorrect) d.correct++;
    byDomain.set(i.domain, d);
  }
  const dur = (ms: number) => formatDuration(ms, (min, sec) => (min ? c("durationMinSec", { min, sec }) : c("secondsShort", { count: sec })));

  return (
    <Container className="max-w-5xl space-y-6">
      <PageHeader
        title={t("drillTitle")}
        description={r.completedAt ? t("completedAt", { date: format.dateTime(r.completedAt, { dateStyle: "medium", timeStyle: "short" }) }) : undefined}
        actions={
          <Button asChild>
            <Link href="/practice">{t("practiceAgain")}</Link>
          </Button>
        }
      />
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
            return (
              <li key={`${i.moduleIndex}-${i.position}`} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="font-semibold tabular-nums">{n + 1}</span>
                  <Icon
                    className={`size-5 ${!i.answer ? "text-muted-foreground" : i.isCorrect ? "text-success" : "text-destructive"}`}
                    aria-label={!i.answer ? tt("unanswered") : i.isCorrect ? tt("correct") : tt("incorrect")}
                  />
                  <span className="font-mono">{i.code.toLowerCase()}</span>
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
                />
              </li>
            );
          })}
        </ol>
      </section>
    </Container>
  );
}
