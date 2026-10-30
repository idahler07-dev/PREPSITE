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
      include: { question: { select: { id: true, code: true, skill: true } } },
    }),
    db.questionNote.findMany({
      where: { userId: user.id, OR: [{ bookmarked: true }, { note: { not: null } }], question: { status: "PUBLISHED" } },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: { question: { select: { code: true, skill: true } } },
    }),
  ]);

  return (
    <Container className="max-w-4xl space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dueTitle", { count: counts.due })}</CardTitle>
            <CardDescription>{t("dueHelp", { total: counts.total })}</CardDescription>
          </CardHeader>
          <CardContent>
            <StartReviewButton source="due" disabled={counts.due === 0} label={t("start")} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("bookmarksTitle", { count: counts.bookmarks })}</CardTitle>
            <CardDescription>{t("bookmarksHelp")}</CardDescription>
          </CardHeader>
          <CardContent>
            <StartReviewButton source="bookmarks" disabled={counts.bookmarks === 0} label={t("practiceBookmarks")} />
          </CardContent>
        </Card>
      </div>

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
                <span className="font-mono">{i.question.code.toLowerCase()}</span>
                <span className="text-muted-foreground">{tx(`skills.${i.question.skill as "INFERENCES"}`)}</span>
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
                <span className="font-mono">{b.question.code.toLowerCase()}</span> <span className="text-muted-foreground">{tx(`skills.${b.question.skill as "INFERENCES"}`)}</span>
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
