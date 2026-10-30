"use client";

import "katex/dist/katex.min.css"; // math styles only where math is shown
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Lightbulb, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/mascot";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type Mode = "hint" | "explain" | "whyWrong" | "another" | "simpler";
type Event = { type: "start"; cached: boolean } | { type: "delta"; text: string } | { type: "flagged" } | { type: "done"; remaining: number | null } | { type: "error"; code: string };

const MAX_CHARS = 600;

/** Markdown + LaTeX → sanitized HTML, loaded only when the tutor is used. */
function useMarkdown(text: string): string {
  const [html, setHtml] = useState("");
  useEffect(() => {
    let live = true;
    void import("@/lib/markdown/render").then(({ renderMarkdown }) => {
      if (live) setHtml(renderMarkdown(text));
    });
    return () => {
      live = false;
    };
  }, [text]);
  return html;
}

function Answer({ text, className }: { text: string; className?: string }) {
  const html = useMarkdown(text);
  // renderMarkdown sanitizes its output (same pipeline as question content).
  return html ? <div className={cn("question-content text-sm", className)} dangerouslySetInnerHTML={{ __html: html }} /> : <p className={cn("whitespace-pre-wrap text-sm", className)}>{text}</p>;
}

async function readEvents(res: Response, onEvent: (e: Event) => void) {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (line) onEvent(JSON.parse(line) as Event);
    }
  }
}

/**
 * AI tutor for one question. Before the question is answered (drills only) it
 * offers a hint; afterwards, explanations in several styles and follow-ups.
 */
export function AiTutor({
  attemptId,
  questionId,
  answered,
  wrongChoice,
  autoStart,
  focusFollowUp = false,
}: {
  attemptId: string;
  questionId: string;
  answered: boolean;
  wrongChoice: boolean;
  /** Ask for this explanation as soon as the tutor opens. */
  autoStart?: Mode;
  /** Put the cursor in the follow-up box once the first answer is in. */
  focusFollowUp?: boolean;
}) {
  const t = useTranslations("tutor");
  const locale = useLocale();
  const [mode, setMode] = useState<Mode | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [chat, setChat] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [draft, setDraft] = useState("");
  const live = useRef<HTMLDivElement>(null);
  const followUp = useRef<HTMLTextAreaElement>(null);
  const started = useRef(false);

  async function call(url: string, body: object, onText: (chunk: string) => void) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "AI_FAILED");
        return false;
      }
      let ok = true;
      await readEvents(res, (e) => {
        if (e.type === "delta") onText(e.text);
        else if (e.type === "flagged") setFlagged(true);
        else if (e.type === "error") {
          setError(e.code);
          ok = false;
        } else if (e.type === "done" && e.remaining !== null) setRemaining(e.remaining);
      });
      return ok;
    } catch {
      setError("NETWORK");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function ask(m: Mode) {
    if (busy) return;
    setMode(m);
    setText("");
    setFlagged(false);
    setChat([]);
    await call("/api/ai/tutor", { attemptId, questionId, mode: m, locale }, (c) => setText((prev) => prev + c));
  }

  async function send() {
    const message = draft.trim();
    if (!message || !mode || busy) return;
    setDraft("");
    setChat((c) => [...c, { role: "user", content: message }, { role: "assistant", content: "" }]);
    const ok = await call("/api/ai/tutor/chat", { attemptId, questionId, mode, locale, message }, (chunk) =>
      setChat((c) => [...c.slice(0, -1), { role: "assistant", content: c.at(-1)!.content + chunk }]),
    );
    if (!ok) setChat((c) => (c.at(-1)?.content ? c : c.slice(0, -2)));
  }

  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true;
      void ask(autoStart);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);
  useEffect(() => {
    if (focusFollowUp && text && !busy && !flagged) followUp.current?.focus();
  }, [focusFollowUp, text, busy, flagged]);

  const modes: Mode[] = answered ? ["explain", ...(wrongChoice ? (["whyWrong"] as const) : []), "another", "simpler"] : ["hint"];
  const errorText =
    error === "QUOTA_EXCEEDED"
      ? t("errors.quota")
      : error === "RATE_LIMITED"
        ? t("errors.rateLimited")
        : error === "CHAT_LIMIT"
          ? t("errors.chatLimit")
          : error === "AI_UNAVAILABLE"
            ? t("errors.unavailable")
            : error
              ? t("errors.other")
              : null;

  return (
    <section className="space-y-3 rounded-[14px] border bg-surface p-4 shadow-sm" aria-label={t("title")}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-sm font-semibold">
          <Mascot pose={busy ? "think" : "wave"} className="w-9" /> {t("title")}
        </span>
        {modes.map((m) => (
          <Button key={m} size="sm" variant={mode === m ? "default" : "outline"} disabled={busy} onClick={() => void ask(m)}>
            {m === "hint" && <Lightbulb aria-hidden />}
            {t(`modes.${m}`)}
          </Button>
        ))}
      </div>

      {mode && (
        <div ref={live} aria-live="polite" aria-busy={busy} className="space-y-3">
          {busy && !text && !flagged && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden /> {t("thinking")}
            </p>
          )}
          {flagged ? <p className="rounded-md bg-background p-3 text-sm">{t("flagged")}</p> : text && <Answer text={text} className="rounded-md bg-background p-3" />}

          {chat.map((m, i) =>
            m.role === "user" ? (
              <p key={i} className="ms-auto max-w-[85%] rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">
                {m.content}
              </p>
            ) : m.content ? (
              <Answer key={i} text={m.content} className="max-w-[95%] rounded-md bg-background p-3" />
            ) : null,
          )}

          {text && !flagged && !busy && (
            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <label htmlFor={`ask-${questionId}`} className="sr-only">
                {t("followUp")}
              </label>
              <Textarea
                ref={followUp}
                id={`ask-${questionId}`}
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))}
                placeholder={t("followUpPlaceholder")}
                rows={2}
                className="min-h-0 flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
              />
              <Button type="submit" size="icon" disabled={!draft.trim()} aria-label={t("send")}>
                <Send aria-hidden />
              </Button>
            </form>
          )}
          {errorText && (
            <p role="alert" className="text-sm text-destructive">
              {errorText}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {t("disclaimer")}
            {remaining !== null && ` ${t("remaining", { count: remaining })}`}
          </p>
        </div>
      )}
    </section>
  );
}
