"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Progress } from "@/components/ui/progress";

interface Status {
  status: string;
  total: number;
  done: number;
  failed: number;
}

/** Live progress of a PDF import; refreshes the page when it finishes. */
export function ImportProgress({ batchId, initial }: { batchId: string; initial: Status }) {
  const t = useTranslations("admin.import.progress");
  const router = useRouter();
  const [s, setS] = useState(initial);

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/admin/imports/${batchId}/status`, { cache: "no-store" });
        if (res.ok) {
          const next = (await res.json()) as Status;
          if (stop) return;
          setS(next);
          if (next.status === "READY" || next.status === "FAILED") {
            router.refresh();
            return;
          }
        }
      } catch {}
      if (!stop) setTimeout(tick, 2000);
    };
    const id = setTimeout(tick, 1500);
    return () => {
      stop = true;
      clearTimeout(id);
    };
  }, [batchId, router]);

  const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
  const label = s.status === "PENDING" || (s.status === "PROCESSING" && s.total === 0) ? t("preparing") : s.status === "FINALIZING" ? t("finalizing") : t("pages", { done: s.done, total: s.total });
  return (
    <div className="space-y-3 rounded-lg border p-5" aria-live="polite">
      <h2 className="flex items-center gap-2 font-semibold">
        <Loader2 className="size-4 animate-spin" aria-hidden /> {t("title")}
      </h2>
      <Progress value={s.status === "FINALIZING" ? 100 : pct} aria-label={label} />
      <p className="text-sm">{label}</p>
      {s.failed > 0 && <p className="text-sm text-destructive">{t("failedPages", { count: s.failed })}</p>}
      <p className="text-xs text-muted-foreground">{t("keepOpen")}</p>
    </div>
  );
}
