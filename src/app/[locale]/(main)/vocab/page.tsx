import { getLocale, getTranslations } from "next-intl/server";
import { requireUser } from "@/server/auth/session";
import { vocabCounts, vocabSession } from "@/server/vocab/service";
import { Container, PageHeader } from "@/components/layout/page-header";
import { Flashcards } from "@/components/learning/flashcards";

export async function generateMetadata() {
  const t = await getTranslations("vocab");
  return { title: t("title") };
}

export default async function VocabPage() {
  const user = await requireUser("/vocab");
  const t = await getTranslations("vocab");
  const locale = await getLocale();
  const [cards, counts] = await Promise.all([vocabSession(user.id), vocabCounts(user.id)]);
  return (
    <Container className="max-w-2xl">
      <PageHeader title={t("title")} description={t("subtitle", { due: counts.due, learning: counts.learning, unseen: counts.unseen })} />
      <Flashcards
        cards={cards.map((c) => ({
          id: c.id,
          word: c.word,
          partOfSpeech: c.partOfSpeech,
          definition: c.definition,
          example: c.example,
          translation: (c.translations as Record<string, string>)[locale] ?? "",
          isNew: c.isNew,
        }))}
      />
    </Container>
  );
}
