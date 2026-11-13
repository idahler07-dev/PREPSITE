import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { requireUser } from "@/server/auth/session";
import { notebookCounts } from "@/server/review/service";
import { Container, PageHeader } from "@/components/layout/page-header";
import {
  MistakeCauseSelect,
  RemoveFromNotebook,
  StartReviewButton,
} from "@/components/learning/review-actions";
import { recurringMistakes } from "@/lib/srs/patterns";

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

  const eyebrow = (k: string) => (
    <p className="text-[12px] font-bold tracking-[0.14em] text-[#A9730E] uppercase">
      {k}
    </p>
  );

  return (
    <Container className="max-w-5xl space-y-12">
      <PageHeader
        art="review"
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("subtitle")}
      />

      {/* Today: what is due, one action */}
      <section className="flex flex-col items-center gap-6 rounded-[24px] border border-border bg-surface p-7 text-center sm:flex-row sm:p-8 sm:text-start">
        <img
          src={
            counts.due > 0
              ? "/illustrations/fluent/alarm-clock.svg"
              : "/illustrations/fluent/trophy.svg"
          }
          alt=""
          className="size-20 shrink-0"
        />
        <div className="min-w-0 flex-1">
          {counts.due > 0 ? (
            <>
              <p className="font-display text-[44px] leading-none font-extrabold tracking-[-0.04em] tabular-nums">
                {counts.due}{" "}
                <span className="text-[22px] tracking-[-0.02em]">
                  {t("hero.due")}
                </span>
              </p>
              <p className="mt-2 text-muted-foreground">{t("hero.dueShort")}</p>
            </>
          ) : (
            <>
              <p className="font-display text-[28px] font-extrabold tracking-[-0.03em]">
                {t("hero.caught")}
              </p>
              <p className="mt-1 text-muted-foreground">
                {t("hero.caughtShort")}
              </p>
            </>
          )}
        </div>
        {counts.due > 0 && (
          <StartReviewButton source="due" disabled={false} label={t("start")} />
        )}
      </section>

      {patterns.length > 0 && (
        <section aria-labelledby="patterns-title" className="space-y-5">
          <div className="space-y-2">
            {eyebrow(t("patterns.eyebrow"))}
            <h2
              id="patterns-title"
              className="font-display text-[26px] font-extrabold tracking-[-0.03em]"
            >
              {t("patterns.title")}
            </h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-3">
            {patterns.map((p, k) => (
              <li
                key={p.skill}
                className="group flex flex-col gap-4 rounded-[20px] border border-border bg-surface p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-[34px] leading-none font-extrabold tracking-[-0.04em] text-energy tabular-nums">
                    {p.count}
                  </span>
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[12px] font-bold text-muted-foreground">
                    #{k + 1}
                  </span>
                </div>
                <div>
                  <p className="text-[16px] leading-snug font-extrabold tracking-[-0.01em]">
                    {tx(`skills.${p.skill as "INFERENCES"}`)}
                  </p>
                  {p.cause && (
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      {t(`causes.${p.cause}`)}
                    </p>
                  )}
                </div>
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
            <p className="text-[13px] text-muted-foreground">
              {t("patterns.tagHint")}
            </p>
          )}
        </section>
      )}

      <section aria-labelledby="nb-title" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            {eyebrow(t("notebookEyebrow"))}
            <h2
              id="nb-title"
              className="font-display text-[26px] font-extrabold tracking-[-0.03em]"
            >
              {t("notebook")}
            </h2>
          </div>
          {counts.bookmarks > 0 && (
            <StartReviewButton
              source="bookmarks"
              disabled={false}
              label={t("practiceBookmarks")}
            />
          )}
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-[24px] border border-dashed border-border px-6 py-12 text-center">
            <img
              src="/illustrations/fluent/notebook.svg"
              alt=""
              className="size-16"
            />
            <p className="text-muted-foreground">{t("emptyShort")}</p>
            <Button asChild>
              <Link href="/practice">{t("emptyCta")}</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-[20px] border border-border bg-surface">
            {items.map((i) => (
              <li
                key={i.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 text-sm"
              >
                <span
                  className={`size-2 shrink-0 rounded-full ${i.reason === "WRONG" ? "bg-energy" : i.reason === "FLAGGED" ? "bg-primary" : "bg-[#F2C14E]"}`}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 font-semibold">
                  {tx(`skills.${i.question.skill as "INFERENCES"}`)}
                </span>
                {i.reason !== "BOOKMARK" && (
                  <MistakeCauseSelect
                    questionId={i.question.id}
                    value={i.cause}
                  />
                )}
                <span className="w-24 text-end text-[13px] text-muted-foreground">
                  {i.dueAt <= now
                    ? t("dueNow")
                    : format.dateTime(i.dueAt, {
                        day: "numeric",
                        month: "short",
                      })}
                </span>
                <RemoveFromNotebook questionId={i.question.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {bookmarks.some((b) => b.note) && (
        <section aria-labelledby="notes-title" className="space-y-5">
          <h2
            id="notes-title"
            className="font-display text-[26px] font-extrabold tracking-[-0.03em]"
          >
            {t("notes")}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {bookmarks
              .filter((b) => b.note)
              .map((b) => (
                <li
                  key={b.id}
                  className="rounded-[20px] border border-border bg-surface-2 p-5 text-sm"
                >
                  <p className="font-semibold">
                    {tx(`skills.${b.question.skill as "INFERENCES"}`)}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                    {b.note}
                  </p>
                </li>
              ))}
          </ul>
        </section>
      )}
    </Container>
  );
}
