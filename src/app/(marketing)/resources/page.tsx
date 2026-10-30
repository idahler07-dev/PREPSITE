import { getFormatter, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/auth/session";
import { OfficialScoreForm, DeleteScoreButton } from "@/components/learning/official-score";
import { ExternalLink } from "lucide-react";
import siteConfig from "@site";
import { Container, PageHeader } from "@/components/layout/page-header";

export async function generateMetadata() {
  const t = await getTranslations("resources");
  return { title: t("title") };
}

export default async function ResourcesPage() {
  const t = await getTranslations("resources");
  const tx = await getTranslations("taxonomy");
  const format = await getFormatter();
  const user = await getCurrentUser();
  const scores = user ? await db.officialScore.findMany({ where: { userId: user.id }, orderBy: { takenOn: "desc" } }) : [];
  return (
    <Container>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <ul className="grid gap-4 sm:grid-cols-2">
        {siteConfig.officialResources.map((r) => (
          <li key={r.id} className="flex flex-col rounded-xl border bg-card p-5">
            <h2 className="mb-1 font-semibold">{t(`items.${r.id}.title`)}</h2>
            <p className="mb-4 flex-1 text-sm text-muted-foreground">{t(`items.${r.id}.body`)}</p>
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {t("visit")} <ExternalLink className="size-4" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-muted-foreground">{t("note")}</p>
      {user && (
        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-semibold">{t("log.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("log.body")}</p>
          <OfficialScoreForm />
          {scores.length > 0 && (
            <ul className="divide-y rounded-lg border">
              {scores.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                  <span className="font-medium">{s.testName}</span>
                  <span className="text-muted-foreground">{format.dateTime(s.takenOn, { dateStyle: "medium", timeZone: "UTC" })}</span>
                  <span className="tabular-nums">
                    <strong>{s.total}</strong> ({s.rw} + {s.math})
                  </span>
                  {s.missedSkills.length > 0 && (
                    <span className="text-xs text-muted-foreground">{s.missedSkills.map((k) => tx(`skills.${k as "INFERENCES"}`)).join(", ")}</span>
                  )}
                  <span className="ms-auto">
                    <DeleteScoreButton id={s.id} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </Container>
  );
}
