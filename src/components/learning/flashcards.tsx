"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AnimatePresence, m, useMotionValue, useReducedMotion, useTransform, type PanInfo } from "motion/react";
import { RotateCw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { gradeVocabCard } from "@/server/actions/learning";
import { Button } from "@/components/ui/button";
import { Owl } from "@/components/mascot/owl";
import { playSfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

interface Card {
  id: string;
  word: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  translation: string;
  isNew: boolean;
}

/** The word (and simple inflections) in the example gets a marker highlight. */
function Example({ text, word, className }: { text: string; word: string; className?: string }) {
  const stem = word.replace(/e$/, "");
  const parts = text.split(new RegExp(`(\\b${stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\w*)`, "i"));
  return (
    <p className={cn("font-serif leading-relaxed", className)}>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded-sm px-0.5 font-semibold text-foreground" style={{ background: "linear-gradient(transparent 55%, var(--hl-yellow) 55%)" }}>
            {p}
          </mark>
        ) : (
          p
        ),
      )}
    </p>
  );
}

const GRADES = [
  { key: "again", tone: "bg-danger text-white [--edge:var(--danger-edge)] dark:text-[#0b1020]", fly: { x: -520, rotate: -18 } },
  { key: "hard", tone: "bg-accent text-accent-foreground [--edge:color-mix(in_oklab,var(--accent),black_25%)]", fly: { x: -420, y: 80, rotate: -10 } },
  { key: "good", tone: "bg-correct text-white [--edge:var(--correct-edge)] dark:text-[#0b1020]", fly: { x: 520, rotate: 18 } },
  { key: "easy", tone: "bg-primary text-primary-foreground [--edge:var(--primary-edge)]", fly: { y: -520, rotate: 6 } },
] as const;
type Grade = (typeof GRADES)[number]["key"];

/**
 * A deck: the top card flips in 3D (tap or Space). Once flipped, drag it
 * left for "Again" or right for "Good", or press a grade (1–4). The card
 * flies off in that direction and the next one rises from the stack.
 */
export function Flashcards({ cards }: { cards: Card[] }) {
  const t = useTranslations("vocab");
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [exit, setExit] = useState<{ x?: number; y?: number; rotate?: number }>({ x: 520 });
  const card = cards[index];

  const grade = useCallback(
    async (g: Grade) => {
      if (!card || busy) return;
      setBusy(true);
      const res = await gradeVocabCard({ wordId: card.id, grade: g });
      setBusy(false);
      if (!res.ok) {
        toast.error(t("error"));
        return;
      }
      playSfx(g === "again" ? "incorrect" : "correct");
      setExit(GRADES.find((x) => x.key === g)!.fly);
      setShown(false);
      setIndex((i) => i + 1);
    },
    [card, busy, t],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, [contenteditable=true]")) return;
      if (e.key === " " || e.key === "Enter") {
        if (!card) return;
        e.preventDefault();
        setShown((s) => !s);
      } else if (shown && ["1", "2", "3", "4"].includes(e.key)) {
        void grade(GRADES[Number(e.key) - 1]!.key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, shown, grade]);

  // Confetti once the deck is cleared.
  useEffect(() => {
    if (card || !cards.length || reduce) return;
    void import("canvas-confetti").then(({ default: confetti }) => confetti({ particleCount: 110, spread: 80, origin: { y: 0.55 }, colors: ["#2563EB", "#5B8CFF", "#F59E0B", "#16A34A", "#A78BFA"], disableForReducedMotion: true }));
  }, [card, cards.length, reduce]);

  if (!card)
    return (
      <m.div role="status" className="flex flex-col items-center gap-4 rounded-[32px] border border-border bg-surface px-6 py-12 text-center shadow-sm" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}>
        <Owl pose={cards.length ? "correct" : "happy"} className="w-28" />
        <p className="font-display text-2xl font-extrabold">{cards.length ? t("doneTitle") : t("nothingDue")}</p>
        {cards.length > 0 && <p className="text-muted-foreground">{t("reviewed", { count: cards.length })}</p>}
        <Button asChild variant="outline">
          <Link href="/sat">{t("back")}</Link>
        </Button>
      </m.div>
    );

  return (
    <div className="space-y-6">
      {/* One dot per card */}
      <ol className="flex flex-wrap justify-center gap-1.5" aria-label={t("progress", { current: index + 1, total: cards.length })}>
        {cards.map((c, i) => (
          <li key={c.id} className={cn("h-2 rounded-full transition-all duration-300", i < index ? "w-2 bg-correct" : i === index ? "w-6 bg-primary" : "w-2 bg-surface-2")} />
        ))}
      </ol>

      {/* The deck */}
      <div className="relative mx-auto mb-12 h-[360px] w-full max-w-[560px] [perspective:1400px]">
        {/* Cards waiting underneath */}
        {[2, 1].map((depth) =>
          cards[index + depth] ? (
            <div
              key={`under-${depth}`}
              aria-hidden
              className="absolute inset-0 rounded-[28px] border border-border bg-surface shadow-sm transition-transform duration-300"
              style={{ transform: `translateY(${depth * 14}px) scale(${1 - depth * 0.05}) rotate(${depth === 1 ? -2 : 2.5}deg)` }}
            />
          ) : null,
        )}
        <AnimatePresence initial={false} custom={exit}>
          <TopCard key={card.id} card={card} shown={shown} onFlip={() => setShown((s) => !s)} onGrade={(g) => void grade(g)} exit={exit} reduce={!!reduce} />
        </AnimatePresence>
      </div>

      {/* Grades */}
      <AnimatePresence mode="wait" initial={false}>
        {shown ? (
          <m.div key="grades" role="group" aria-label={t("howWell")} className="mx-auto grid max-w-[560px] grid-cols-4 gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
            {GRADES.map((g, i) => (
              <button
                key={g.key}
                type="button"
                disabled={busy}
                onClick={() => void grade(g.key)}
                className={cn("flex h-14 flex-col items-center justify-center rounded-2xl font-display text-sm font-extrabold shadow-[0_4px_0_var(--edge)] transition-[transform,box-shadow] active:translate-y-[2px] active:shadow-[0_2px_0_var(--edge)] disabled:opacity-60", g.tone)}
              >
                {t(`grades.${g.key}`)}
                <span className="text-[10px] font-bold opacity-70">{i + 1}</span>
              </button>
            ))}
          </m.div>
        ) : (
          <m.div key="flip" className="flex justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Button size="lg" onClick={() => setShown(true)}>
              <RotateCw aria-hidden />
              {t("show")}
            </Button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TopCard({ card, shown, onFlip, onGrade, exit, reduce }: { card: Card; shown: boolean; onFlip: () => void; onGrade: (g: Grade) => void; exit: { x?: number; y?: number; rotate?: number }; reduce: boolean }) {
  const t = useTranslations("vocab");
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 240], [-14, 14]);
  const againTint = useTransform(x, [-160, -40], [0.22, 0]);
  const goodTint = useTransform(x, [40, 160], [0, 0.22]);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (!shown) return;
    if (info.offset.x < -120 || info.velocity.x < -600) onGrade("again");
    else if (info.offset.x > 120 || info.velocity.x > 600) onGrade("good");
  }

  const face = "absolute inset-0 flex flex-col justify-center gap-4 overflow-hidden rounded-[28px] border-2 border-border bg-surface p-7 shadow-[0_24px_50px_-28px_rgb(15_23_42/0.35)] [backface-visibility:hidden] sm:p-9 dark:shadow-none";
  return (
    <m.div
      className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
      style={{ x, rotate }}
      drag={shown && !reduce ? "x" : false}
      dragSnapToOrigin
      dragElastic={0.7}
      onDragEnd={onDragEnd}
      initial={reduce ? { opacity: 0 } : { scale: 0.92, y: 28, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={reduce ? { opacity: 0 } : { ...exit, opacity: 0, transition: { duration: 0.35, ease: [0.4, 0, 1, 1] } }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
    >
      <m.div
        role="button"
        tabIndex={0}
        aria-label={t("flip")}
        aria-pressed={shown}
        onClick={onFlip}
        className="relative size-full outline-none [transform-style:preserve-3d] focus-visible:ring-4 focus-visible:ring-ring/40 rounded-[28px]"
        animate={{ rotateY: shown ? 180 : 0 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 24 }}
      >
        {/* Front: the word in context */}
        <div className={face}>
          <div className="flex flex-wrap items-baseline gap-2.5">
            <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{card.word}</h2>
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-sm font-semibold text-muted-foreground italic">{card.partOfSpeech}</span>
            {card.isNew && <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-extrabold text-accent-ink uppercase">{t("new")}</span>}
          </div>
          <Example text={card.example} word={card.word} className="text-lg sm:text-xl" />
          <RotateCw className="absolute right-6 bottom-6 size-5 text-muted-foreground/60" aria-hidden />
        </div>

        {/* Back: the meaning */}
        <div className={cn(face, "[transform:rotateY(180deg)]")}>
          <p className="font-display text-lg font-extrabold text-primary">{card.word}</p>
          <p className="text-2xl leading-snug font-semibold">{card.definition}</p>
          {card.translation && <p className="text-muted-foreground">{card.translation}</p>}
          <Example text={card.example} word={card.word} className="border-t border-border pt-4 text-base text-muted-foreground" />
          <m.span aria-hidden className="pointer-events-none absolute inset-0 rounded-[28px] bg-danger" style={{ opacity: againTint }} />
          <m.span aria-hidden className="pointer-events-none absolute inset-0 rounded-[28px] bg-correct" style={{ opacity: goodTint }} />
        </div>
      </m.div>
    </m.div>
  );
}
