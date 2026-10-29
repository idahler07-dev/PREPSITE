"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Bookmark, CalendarCheck, Loader2, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { openDailyQuestion, removeNotebookItem, startReviewSession, updateQuestionNote } from "@/server/actions/learning";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function useLimitToast() {
  const tb = useTranslations("billing");
  const c = useTranslations("common");
  const router = useRouter();
  return (res: { error: string; message?: string }) => {
    if (res.error === "DAILY_LIMIT")
      toast.error(tb("limits.daily", { left: Number(res.message) || 0 }), { action: { label: tb("limits.upgrade"), onClick: () => router.push("/pricing") } });
    else toast.error(c("unknownError"));
  };
}

export function StartReviewButton({ source, disabled, label }: { source: "due" | "bookmarks"; disabled: boolean; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const fail = useLimitToast();
  return (
    <Button
      disabled={disabled || pending}
      onClick={() =>
        start(async () => {
          const res = await startReviewSession({ source, count: 10 });
          if (res.ok) router.push(`/test/${res.data}`);
          else fail(res);
        })
      }
    >
      {pending && <Loader2 className="animate-spin" aria-hidden />} {label}
    </Button>
  );
}

export function DailyQuestionButton({ label }: { label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const fail = useLimitToast();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await openDailyQuestion();
          if (res.ok) router.push(`/test/${res.data}`);
          else fail(res);
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <CalendarCheck aria-hidden />} {label}
    </Button>
  );
}

export function RemoveFromNotebook({ questionId }: { questionId: string }) {
  const t = useTranslations("review");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="icon"
      variant="ghost"
      className="size-7"
      disabled={pending}
      aria-label={t("remove")}
      title={t("remove")}
      onClick={() =>
        start(async () => {
          await removeNotebookItem(questionId);
          router.refresh();
        })
      }
    >
      <X aria-hidden />
    </Button>
  );
}

/** Bookmark toggle and a private note on one question (results pages). */
export function QuestionNoteControls({ questionId, initial }: { questionId: string; initial: { bookmarked: boolean; note: string | null } }) {
  const t = useTranslations("review");
  const [bookmarked, setBookmarked] = useState(initial.bookmarked);
  const [note, setNote] = useState(initial.note ?? "");
  const [open, setOpen] = useState(!!initial.note);
  const [saved, setSaved] = useState(true);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={bookmarked ? "secondary" : "ghost"}
          aria-pressed={bookmarked}
          onClick={async () => {
            setBookmarked(!bookmarked);
            const res = await updateQuestionNote({ questionId, bookmarked: !bookmarked });
            if (!res.ok) setBookmarked(bookmarked);
          }}
        >
          <Bookmark className={cn(bookmarked && "fill-current")} aria-hidden /> {bookmarked ? t("bookmarked") : t("bookmark")}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {t("myNote")}
        </Button>
      </div>
      {open && (
        <div className="space-y-1">
          <label htmlFor={`qn-${questionId}`} className="sr-only">
            {t("myNote")}
          </label>
          <Textarea
            id={`qn-${questionId}`}
            value={note}
            rows={3}
            maxLength={2000}
            onChange={(e) => {
              setNote(e.target.value);
              setSaved(false);
            }}
            onBlur={async () => {
              if (saved) return;
              const res = await updateQuestionNote({ questionId, note });
              setSaved(res.ok);
            }}
          />
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {saved ? t("noteSaved") : t("noteUnsaved")}
          </p>
        </div>
      )}
    </div>
  );
}
