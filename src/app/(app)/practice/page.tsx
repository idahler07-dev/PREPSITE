import { getFormatter, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { requireUser } from "@/server/auth/session";
import { Container, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { DrillBuilder } from "@/components/practice/drill-builder";
import { domainOfSkill } from "@/lib/taxonomy";

export async function generateMetadata() {
  const t = await getTranslations("practice");
  return { title: t("title") };
}

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string; section?: string }>;
}) {
  const user = await requireUser("/practice");
  const sp = await searchParams;
  const skillDomain = sp.skill ? domainOfSkill(sp.skill) : undefined;
  const t = await getTranslations("practice");
  const th = await getTranslations("history");
  const format = await getFormatter();
  const open = await db.attempt.findMany({
    where: { userId: user.id, status: "IN_PROGRESS" },
    orderBy: { startedAt: "desc" },
    take: 5,
    select: {
      id: true,
      kind: true,
      startedAt: true,
      _count: { select: { modules: true } },
    },
  });
  return (
    <Container className="max-w-4xl">
      <PageHeader art="bank" title={t("title")} />
      {open.length > 0 && (
        <section className="glass-card mb-6 rounded-2xl p-4">
          <h2 className="mb-2 font-semibold">{t("inProgress")}</h2>
          <ul className="divide-y divide-border/60">
            {open.slice(0, 1).map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 py-1 text-sm"
              >
                <span>
                  {th(`kinds.${a.kind}`)} ·{" "}
                  {format.dateTime(a.startedAt, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                <Button asChild size="sm">
                  <a href={`/test/${a.id}`}>{t("resume")}</a>
                </Button>
              </li>
            ))}
          </ul>
          {open.length > 1 && (
            <details className="mt-1">
              <summary className="cursor-pointer py-2 text-sm text-muted-foreground">
                {t("moreInProgress", { count: open.length - 1 })}
              </summary>
              <ul className="divide-y divide-border/60">
                {open.slice(1).map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 py-1 text-sm"
                  >
                    <span>
                      {th(`kinds.${a.kind}`)} ·{" "}
                      {format.dateTime(a.startedAt, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                    <Button asChild size="sm" variant="secondary">
                      <a href={`/test/${a.id}`}>{t("resume")}</a>
                    </Button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}
      <DrillBuilder
        initial={
          skillDomain
            ? {
                section: skillDomain.section,
                domains: [skillDomain.key],
                skills: [sp.skill!],
              }
            : sp.section === "RW" || sp.section === "MATH"
              ? { section: sp.section }
              : undefined
        }
      />
    </Container>
  );
}
