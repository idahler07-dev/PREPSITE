import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { requireUser } from "@/server/auth/session";
import { notebookCounts } from "@/server/review/service";
import { Container, PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RemoveFromNotebook, StartReviewButton } from "@/components/learning/review-actions";
import { Owl } from "@/components/mascot/owl";

export async function generateMetadata() {
  const t = await getTranslations("review");
  return { title: t("title") };
}

export default async function ReviewPage() {
  const user = await requireUser("/review");
  const t = await getTranslations("review");
  const tx = await getTranslations("taxonomy");
  const format = await getFormatter();
  const now = new Date();
  const [counts, items, bookmarks] = await Promise.all([
    notebookCounts(user.id, now),
    db.reviewItem.findMany({
      where: { userId: user.id, archivedAt: null, question: { status: "PUBLISHED" } },
      orderBy: { dueAt: "asc" },
      take: 100,
      include: { question: { select: { id: true, skill: true } } },
    }),
    db.questionNote.findMany({
      where: { userId: user.id, OR: [{ bookmarked: true }, { note: { not: null } }], question: { status: "PUBLISHED" } },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: { question: { select: { skill: true } } },
    }),
  ]);

  return (
    <Container className="max-w-4xl space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />
      {/* Hero: how many are due today, or all caught up. */}
      <div className={`flex flex-col items-center gap-5 overflow-hidden rounded-[32px] p-6 text-center sm:flex-row sm:p-8 sm:text-start ${counts.due > 0 ? "bg-review text-primary-foreground shadow-[0_6px_0_color-mix(in_oklab,var(--review),black_25%)]" : "border border-border bg-surface"}`}>
        <Owl pose={counts.due > 0 ? "thinking" : "correct"} className="w-28 shrink-0" />
        <div className="flex-1">
          {counts.due > 0 ? (
            <>
              <p className="font-display text-5xl leading-none font-extrabold tabular-nums">
                {counts.due} <span className="text-2xl">{t("hero.due")}</span>
              </p>
              <p className="mt-2 opacity-90">{t("hero.dueLabel", { count: counts.due })}</p>
            </>
          ) : (
            <>
              <p className="font-display text-3xl font-extrabold">{t("hero.caught")}</p>
              <p className="mt-1 text-muted-foreground">{t("hero.caughtBody")}</p>
            </>
          )}
        </div>
        {counts.due > 0 && (
          <div className="shrink-0 [&_button]:bg-white [&_button]:text-[#6d28d9] [&_button]:shadow-[0_4px_0_rgb(15_23_42/0.25)]">
            <StartReviewButton source="due" disabled={false} label={t("start")} />
          </div>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("bookmarksTitle", { count: counts.bookmarks })}</CardTitle>
          <CardDescription>{t("bookmarksHelp")}</CardDescription>
        </CardHeader>
        <CardContent>
          <StartReviewButton source="bookmarks" disabled={counts.bookmarks === 0} label={t("practiceBookmarks")} />
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("notebook")}</h2>
        {items.length === 0 ? (
          <EmptyState
            pose="cheer"
            body={t("empty")}
            action={
              <Button asChild>
                <Link href="/practice">{t("emptyCta")}</Link>
              </Button>
            }
          />
        ) : (
          <ul className="divide-y rounded-lg border">
            {items.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                <span className="font-medium">{tx(`skills.${i.question.skill as "INFERENCES"}`)}</span>
                <Badge variant="secondary">{t(`reasons.${i.reason as "WRONG"}`)}</Badge>
                <span className="ms-auto text-muted-foreground">
                  {i.dueAt <= now ? t("dueNow") : t("dueOn", { date: format.dateTime(i.dueAt, { dateStyle: "medium" }) })}
                </span>
                <RemoveFromNotebook questionId={i.question.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {bookmarks.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">{t("notes")}</h2>
          <ul className="space-y-2">
            {bookmarks.map((b) => (
              <li key={b.id} className="rounded-lg border p-3 text-sm">
                <span className="font-medium">{tx(`skills.${b.question.skill as "INFERENCES"}`)}</span>
                {b.bookmarked && <Badge className="ms-2">{t("bookmarked")}</Badge>}
                {b.note && <p className="mt-1 whitespace-pre-wrap">{b.note}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </Container>
  );
}
