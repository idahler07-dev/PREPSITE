"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { gradeVocabCard } from "@/server/actions/learning";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Card {
  id: string;
  word: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  translation: string;
  isNew: boolean;
}

/** Highlight the word (and simple inflections) in the example sentence. */
function Example({ text, word }: { text: string; word: string }) {
  const stem = word.replace(/e$/, "");
  const parts = text.split(new RegExp(`(\\b${stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\w*)`, "i"));
  return (
    <p className="text-lg leading-relaxed">
      {parts.map((p, i) => (i % 2 === 1 ? <strong key={i}>{p}</strong> : p))}
    </p>
  );
}

const GRADES = ["again", "hard", "good", "easy"] as const;

export function Flashcards({ cards }: { cards: Card[] }) {
  const t = useTranslations("vocab");
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const card = cards[index];

  if (!card)
    return (
      <div role="status" className="space-y-4 rounded-lg border p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden />
        <p className="text-lg font-semibold">{cards.length ? t("doneSession") : t("nothingDue")}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard">{t("back")}</Link>
        </Button>
      </div>
    );

  async function grade(g: (typeof GRADES)[number]) {
    setBusy(true);
    const res = await gradeVocabCard({ wordId: card!.id, grade: g });
    setBusy(false);
    if (!res.ok) return toast.error(t("error"));
    setShown(false);
    setIndex((i) => i + 1);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {t("progress", { current: index + 1, total: cards.length })}
      </p>
      <section aria-label={t("card")} className="min-h-64 space-y-4 rounded-xl border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-2">
          <h2 className="text-3xl font-bold">{card.word}</h2>
          <span className="text-muted-foreground">{card.partOfSpeech}</span>
          {card.isNew && <Badge variant="secondary">{t("new")}</Badge>}
        </div>
        <Example text={card.example} word={card.word} />
        {shown ? (
          <div className="space-y-2 border-t pt-4">
            <p>{card.definition}</p>
            {card.translation && <p className="text-muted-foreground">{card.translation}</p>}
          </div>
        ) : (
          <Button onClick={() => setShown(true)} autoFocus>
            {t("show")}
          </Button>
        )}
      </section>
      {shown && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label={t("howWell")}>
          {GRADES.map((g) => (
            <Button key={g} variant={g === "again" ? "outline" : g === "good" ? "default" : "secondary"} disabled={busy} onClick={() => void grade(g)}>
              {t(`grades.${g}`)}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
