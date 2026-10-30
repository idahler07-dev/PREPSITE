import { getFormatter, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { requireUser } from "@/server/auth/session";
import { Link } from "@/i18n/navigation";
import { Container, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { DrillBuilder } from "@/components/practice/drill-builder";
import { domainOfSkill } from "@/lib/taxonomy";

export async function generateMetadata() {
  const t = await getTranslations("practice");
  return { title: t("title") };
}

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ skill?: string; section?: string }> }) {
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
    select: { id: true, kind: true, startedAt: true, _count: { select: { modules: true } } },
  });
  return (
    <Container className="max-w-4xl">
      <PageHeader title={t("title")} description={t("subtitle")} />
      {open.length > 0 && (
        <section className="mb-6 rounded-xl border bg-primary-soft/50 p-4">
          <h2 className="mb-2 font-semibold">{t("inProgress")}</h2>
          <ul className="space-y-2">
            {open.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {th(`kinds.${a.kind}`)} · {format.dateTime(a.startedAt, { dateStyle: "medium", timeStyle: "short" })}
                </span>
                <Button asChild size="sm">
                  <Link href={`/test/${a.id}`}>{t("resume")}</Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <DrillBuilder
        initial={
          skillDomain
            ? { section: skillDomain.section, domains: [skillDomain.key], skills: [sp.skill!] }
            : sp.section === "RW" || sp.section === "MATH"
              ? { section: sp.section }
              : undefined
        }
      />
    </Container>
  );
}
