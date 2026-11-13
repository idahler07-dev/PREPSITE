import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { requireUser } from "@/server/auth/session";
import { notebookCounts } from "@/server/review/service";
import { Container, PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MistakeCauseSelect,
  RemoveFromNotebook,
  StartReviewButton,
} from "@/components/learning/review-actions";
import { Owl } from "@/components/mascot/owl";
import { recurringMistakes } from "@/lib/srs/patterns";
import { Spot } from "@/components/illustrations/spot";

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
  const [counts, items, bookmarks, history] = await Promise.all([
    notebookCounts(user.id, now),
    db.reviewItem.findMany({
      where: {
        userId: user.id,
        archivedAt: null,
        question: { status: "PUBLISHED" },
      },
      orderBy: { dueAt: "asc" },
      take: 100,
      include: { question: { select: { id: true, skill: true } } },
    }),
    db.questionNote.findMany({
      where: {
        userId: user.id,
        OR: [{ bookmarked: true }, { note: { not: null } }],
        question: { status: "PUBLISHED" },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: { question: { select: { skill: true } } },
    }),
    db.reviewItem.findMany({
      where: { userId: user.id, archivedAt: null },
      select: {
        reason: true,
        cause: true,
        lapses: true,
        question: { select: { skill: true } },
      },
      take: 1000,
    }),
  ]);
  const patterns = recurringMistakes(
    history.map((h) => ({
      skill: h.question.skill,
      reason: h.reason,
      cause: h.cause,
      lapses: h.lapses,
    })),
  );
  const anyTagged = history.some((h) => h.cause);

  return (
    <Container className="max-w-4xl space-y-6">
      <PageHeader art="review" title={t("title")} description={t("subtitle")} />
      {/* Hero: how many are due today, or all caught up. */}
      <div
        className={`flex flex-col items-center gap-5 overflow-hidden rounded-[32px] p-6 text-center sm:flex-row sm:p-8 sm:text-start ${counts.due > 0 ? "bg-review text-primary-foreground shadow-[0_6px_0_color-mix(in_oklab,var(--review),black_25%)]" : "border border-border bg-surface"}`}
      >
        <Owl
          pose={counts.due > 0 ? "thinking" : "correct"}
          className="w-24 shrink-0"
        />
        <div className="flex-1">
          {counts.due > 0 ? (
            <>
              <p className="font-display text-5xl leading-none font-extrabold tabular-nums">
                {counts.due} <span className="text-2xl">{t("hero.due")}</span>
              </p>
              <p className="mt-2 opacity-90">
                {t("hero.dueLabel", { count: counts.due })}
              </p>
            </>
          ) : (
            <>
              <p className="font-display text-3xl font-extrabold">
                {t("hero.caught")}
              </p>
              <p className="mt-1 text-muted-foreground">
                {t("hero.caughtBody")}
              </p>
            </>
          )}
        </div>
        {counts.due > 0 && (
          <div className="shrink-0 [&_button]:bg-white [&_button]:text-[#6d28d9] [&_button]:shadow-[0_4px_0_rgb(15_23_42/0.25)]">
            <StartReviewButton
              source="due"
              disabled={false}
              label={t("start")}
            />
          </div>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("bookmarksTitle", { count: counts.bookmarks })}
          </CardTitle>
          <CardDescription>{t("bookmarksHelp")}</CardDescription>
        </CardHeader>
        <CardContent>
          <StartReviewButton
            source="bookmarks"
            disabled={counts.bookmarks === 0}
            label={t("practiceBookmarks")}
          />
        </CardContent>
      </Card>

      {patterns.length > 0 && (
        <section
          aria-labelledby="patterns-title"
          className="group rounded-2xl border bg-surface p-5 sm:p-6"
        >
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <h2 id="patterns-title" className="text-lg font-semibold">
                {t("patterns.title")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("patterns.body")}
              </p>
            </div>
            <Spot name="target" className="hidden w-24 shrink-0 sm:block" />
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {patterns.map((p) => (
              <li
                key={p.skill}
                className="flex flex-col gap-2 rounded-xl border bg-background p-4"
              >
                <span className="font-medium">
                  {tx(`skills.${p.skill as "INFERENCES"}`)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {t("patterns.count", { count: p.count })}
                  {p.cause && (
                    <>
                      {" "}
                      ·{" "}
                      {t("patterns.mostly", { cause: t(`causes.${p.cause}`) })}
                    </>
                  )}
                </span>
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="mt-auto self-start"
                >
                  <Link href={`/practice?skill=${encodeURIComponent(p.skill)}`}>
                    {t("patterns.drill")}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
          {!anyTagged && (
            <p className="mt-3 text-xs text-muted-foreground">
              {t("patterns.tagHint")}
            </p>
          )}
        </section>
      )}

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
              <li
                key={i.id}
                className="flex flex-wrap items-center gap-3 p-3 text-sm"
              >
                <span className="font-medium">
                  {tx(`skills.${i.question.skill as "INFERENCES"}`)}
                </span>
                <Badge variant="secondary">
                  {t(`reasons.${i.reason as "WRONG"}`)}
                </Badge>
                {i.reason !== "BOOKMARK" && (
                  <MistakeCauseSelect
                    questionId={i.question.id}
                    value={i.cause}
                  />
                )}
                <span className="ms-auto text-muted-foreground">
                  {i.dueAt <= now
                    ? t("dueNow")
                    : t("dueOn", {
                        date: format.dateTime(i.dueAt, { dateStyle: "medium" }),
                      })}
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
                <span className="font-medium">
                  {tx(`skills.${b.question.skill as "INFERENCES"}`)}
                </span>
                {b.bookmarked && (
                  <Badge className="ms-2">{t("bookmarked")}</Badge>
                )}
                {b.note && <p className="mt-1 whitespace-pre-wrap">{b.note}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </Container>
  );
}
