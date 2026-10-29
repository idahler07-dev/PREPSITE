import { getFormatter, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { requireUser } from "@/server/auth/session";
import { Link } from "@/i18n/navigation";
import { testStructure } from "@/config/test-structure";
import type { ScoreEstimate } from "@/lib/mock/scoring";
import { Container, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GenerateMockForm, StartMockMenu } from "@/components/mocks/mock-actions";

export async function generateMetadata() {
  const t = await getTranslations("mocks");
  return { title: t("title") };
}

export default async function MocksPage() {
  const user = await requireUser("/mocks");
  const t = await getTranslations("mocks");
  const th = await getTranslations("history");
  const tx = await getTranslations("taxonomy");
  const format = await getFormatter();

  const [mocks, open, done] = await Promise.all([
    db.mockTest.findMany({ where: { status: "PUBLISHED", kind: "CURATED" }, orderBy: { publishedAt: "desc" }, select: { id: true, title: true, sections: true } }),
    db.attempt.findMany({
      where: { userId: user.id, status: "IN_PROGRESS", kind: { in: ["MOCK", "SECTION", "MODULE"] } },
      orderBy: { startedAt: "desc" },
      select: { id: true, kind: true, startedAt: true, config: true },
    }),
    db.attempt.findMany({
      where: { userId: user.id, status: "COMPLETED", kind: { in: ["MOCK", "SECTION", "MODULE"] } },
      orderBy: { completedAt: "desc" },
      take: 50,
      select: { id: true, mockTestId: true, kind: true, completedAt: true, scores: true, config: true, correctCount: true, totalCount: true },
    }),
  ]);
  const minutes = (s: "RW" | "MATH") => testStructure.sections.find((x) => x.section === s)!.modules.reduce((sum, m) => sum + m.timeLimitSec, 0) / 60;
  const lastFor = (id: string) => done.find((d) => d.mockTestId === id);
  const scoreText = (a: (typeof done)[number]) => {
    const sc = a.scores as ScoreEstimate | null;
    if (sc?.total) return t("estimatedTotal", { score: sc.total.score });
    if (sc?.sections[0]) return t("estimatedSection", { score: sc.sections[0].score });
    return t("rawScore", { correct: a.correctCount ?? 0, total: a.totalCount ?? 0 });
  };

  return (
    <Container className="max-w-4xl space-y-6">
      <PageHeader title={t("title")} description={t("subtitle", { rw: minutes("RW"), math: minutes("MATH"), breakMin: testStructure.breakSec / 60 })} />

      {open.length > 0 && (
        <section className="rounded-xl border bg-accent/50 p-4">
          <h2 className="mb-2 font-semibold">{t("inProgress")}</h2>
          <ul className="space-y-2">
            {open.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {String((a.config as { mockTitle?: string }).mockTitle ?? th(`kinds.${a.kind}`))} · {th(`kinds.${a.kind}`)} ·{" "}
                  {format.dateTime(a.startedAt, { dateStyle: "medium", timeStyle: "short" })}
                </span>
                <Button asChild size="sm">
                  <Link href={`/test/${a.id}`}>{t("resume")}</Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("generateTitle")}</CardTitle>
          <CardDescription>{t("generateHelp")}</CardDescription>
        </CardHeader>
        <CardContent>
          <GenerateMockForm />
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("published")}</h2>
        {mocks.length === 0 ? (
          <p className="text-muted-foreground">{t("none")}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {mocks.map((m) => {
              const last = lastFor(m.id);
              return (
                <li key={m.id}>
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="text-base">{m.title}</CardTitle>
                      <CardDescription>{m.sections.map((s) => tx(`sections.${s}`)).join(" + ")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {last && (
                        <p className="text-sm">
                          <Link href={`/attempts/${last.id}`} className="underline">
                            {t("lastTaken", { date: format.dateTime(last.completedAt!, { dateStyle: "medium" }) })}
                          </Link>{" "}
                          · {scoreText(last)}
                        </p>
                      )}
                      <StartMockMenu mockTestId={m.id} sections={m.sections} />
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">{t("history")}</h2>
          <ul className="divide-y rounded-lg border">
            {done.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                <Link href={`/attempts/${a.id}`} className="font-medium underline">
                  {String((a.config as { mockTitle?: string }).mockTitle ?? th(`kinds.${a.kind}`))}
                </Link>
                <span className="text-muted-foreground">
                  {th(`kinds.${a.kind}`)} · {format.dateTime(a.completedAt!, { dateStyle: "medium" })} · {scoreText(a)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-xs text-muted-foreground">{t("estimateNote")}</p>
    </Container>
  );
}
