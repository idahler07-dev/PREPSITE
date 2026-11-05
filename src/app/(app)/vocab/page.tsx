import { getLocale, getTranslations } from "next-intl/server";
import { BookOpen, Clock, Sparkles } from "lucide-react";
import { requireUser } from "@/server/auth/session";
import { vocabCounts, vocabSession } from "@/server/vocab/service";
import { Flashcards } from "@/components/learning/flashcards";

export async function generateMetadata() {
  const t = await getTranslations("vocab");
  return { title: t("title") };
}

const LETTERS = ["Aa", "¶", "“”", "abc", "?", "&", "Zz"];

/** Vocabulary: a stats strip and a swipeable deck (brief §9: redesigned, not removed). */
export default async function VocabPage() {
  const user = await requireUser("/vocab");
  const t = await getTranslations("vocab");
  const locale = await getLocale();
  const [cards, counts] = await Promise.all([vocabSession(user.id), vocabCounts(user.id)]);
  const stats = [
    { label: t("stats.due"), value: counts.due, icon: Clock, tone: "bg-review-soft text-review" },
    { label: t("stats.learning"), value: counts.learning, icon: BookOpen, tone: "bg-primary-soft text-primary" },
    { label: t("stats.new"), value: counts.unseen, icon: Sparkles, tone: "bg-accent-soft text-accent-ink" },
  ];
  return (
    <div className="relative mx-auto w-full max-w-[760px] px-4 py-8 sm:px-6">
      {/* Decorative letters drifting behind the deck */}
      {LETTERS.map((g, i) => (
        <span
          key={g}
          aria-hidden
          className="path-glyph -z-10 hidden text-review md:block"
          style={{ [i % 2 ? "right" : "left"]: `${-6 + (i % 3) * 4}%`, top: `${18 + i * 11}%`, fontSize: 28 + (i % 3) * 14, opacity: 0.16, ["--t" as string]: `${8 + i}s`, ["--d" as string]: `${-i * 1.7}s`, ["--r" as string]: `${i % 2 ? 12 : -10}deg` }}
        >
          {g}
        </span>
      ))}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">{t("title")}</h1>
        <ul className="flex gap-2">
          {stats.map((s) => (
            <li key={s.label} className={`flex items-center gap-2 rounded-2xl px-3 py-2 ${s.tone}`}>
              <s.icon className="size-4" aria-hidden />
              <span className="font-display text-lg font-extrabold tabular-nums">{s.value}</span>
              <span className="text-xs font-semibold opacity-80">{s.label}</span>
            </li>
          ))}
        </ul>
      </header>
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
    </div>
  );
}
