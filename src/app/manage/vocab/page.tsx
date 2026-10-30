import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VocabForm, VocabPublishToggle } from "@/components/admin/vocab-form";
import { requireOwner } from "@/server/auth/session";

export default async function AdminVocabPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  await requireOwner();
  const { edit } = await searchParams;
  const t = await getTranslations("admin.vocab");
  const words = await db.vocabWord.findMany({ orderBy: { word: "asc" }, include: { _count: { select: { progress: true } } } });
  const editing = edit ? words.find((w) => w.id === edit) : undefined;
  const tr = (w: (typeof words)[number]) => w.translations as { uz?: string; ru?: string };
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{editing ? t("edit", { word: editing.word }) : t("new")}</CardTitle>
        </CardHeader>
        <CardContent>
          <VocabForm
            key={editing?.id ?? "new"}
            id={editing?.id ?? null}
            initial={
              editing
                ? { word: editing.word, partOfSpeech: editing.partOfSpeech, definition: editing.definition, example: editing.example, uz: tr(editing).uz ?? "", ru: tr(editing).ru ?? "", published: editing.published }
                : undefined
            }
          />
        </CardContent>
      </Card>
      <ul className="divide-y rounded-lg border">
        {words.map((w) => (
          <li key={w.id} className="flex flex-wrap items-start gap-3 p-3 text-sm">
            <div className="min-w-0 flex-1">
              <a href={`?edit=${w.id}`} className="font-semibold underline">
                {w.word}
              </a>{" "}
              <span className="text-muted-foreground">{w.partOfSpeech}</span> {!w.published && <Badge variant="secondary">{t("hidden")}</Badge>}
              <p>{w.definition}</p>
              <p className="text-muted-foreground italic">{w.example}</p>
            </div>
            <span className="text-xs text-muted-foreground">{t("learners", { count: w._count.progress })}</span>
            <VocabPublishToggle id={w.id} published={w.published} />
          </li>
        ))}
      </ul>
    </div>
  );
}
