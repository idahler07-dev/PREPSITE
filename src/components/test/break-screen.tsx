"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Coffee, Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { BreakState } from "@/server/attempts/service";

function fmt(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** The break between sections. The next section starts when it ends or when the student resumes early. */
export function BreakScreen({ state }: { state: BreakState }) {
  const t = useTranslations("test.break");
  const tx = useTranslations("taxonomy");
  const router = useRouter();
  const [offset] = useState(() => new Date(state.serverNow).getTime() - Date.now());
  const end = new Date(state.breakEndsAt).getTime();
  const [left, setLeft] = useState(() => end - (Date.now() + offset));
  const [busy, setBusy] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      const l = end - (Date.now() + offset);
      setLeft(l);
      if (l <= 0 && !done.current) {
        done.current = true;
        router.refresh();
      }
    }, 500);
    return () => clearInterval(id);
  }, [end, offset, router]);

  async function resume() {
    setBusy(true);
    await fetch(`/api/attempts/${state.id}/break`, { method: "POST" }).catch(() => null);
    router.refresh();
  }

  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <Coffee className="size-10 text-primary" aria-hidden />
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p role="timer" aria-label={t("remaining")} className="font-mono text-5xl font-semibold tabular-nums">
        {fmt(left)}
      </p>
      <p className="max-w-md text-muted-foreground">{t("body", { section: state.nextSection ? tx(`sections.${state.nextSection}`) : "" })}</p>
      <Button size="lg" onClick={resume} disabled={busy}>
        {busy && <Loader2 className="animate-spin" aria-hidden />} {t("resume")}
      </Button>
    </main>
  );
}
