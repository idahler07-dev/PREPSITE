"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ImportReviewNav({
  batchId,
  show,
  items,
  currentId,
}: {
  batchId: string;
  show: "all" | "flagged" | "drafts";
  items: { id: string; label: string }[];
  currentId: string | null;
}) {
  const t = useTranslations("admin.importReview");
  const router = useRouter();
  const index = items.findIndex((i) => i.id === currentId);
  const href = (q: string | null, s = show) => `/admin/import/${batchId}/review?show=${s}${q ? `&q=${q}` : ""}`;
  const prev = index > 0 ? items[index - 1] : null;
  const next = index >= 0 && index < items.length - 1 ? items[index + 1] : null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={show} onValueChange={(v) => router.push(href(null, v as "all"))}>
        <SelectTrigger size="sm" className="w-48" aria-label={t("show")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("all")}</SelectItem>
          <SelectItem value="flagged">{t("flagged")}</SelectItem>
          <SelectItem value="drafts">{t("drafts")}</SelectItem>
        </SelectContent>
      </Select>
      {items.length > 0 && (
        <>
          <Select value={currentId ?? undefined} onValueChange={(v) => router.push(href(v))}>
            <SelectTrigger size="sm" className="w-56 font-mono" aria-label={t("pick")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {items.map((i) => (
                <SelectItem key={i.id} value={i.id} className="font-mono">
                  {i.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">{t("position", { current: index + 1, total: items.length })}</span>
          <div className="ms-auto flex gap-2">
            <Button asChild variant="outline" size="sm" aria-disabled={!prev} className={!prev ? "pointer-events-none opacity-50" : ""}>
              <Link href={prev ? href(prev.id) : "#"}>
                <ChevronLeft aria-hidden /> {t("previous")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" aria-disabled={!next} className={!next ? "pointer-events-none opacity-50" : ""}>
              <Link href={next ? href(next.id) : "#"}>
                {t("next")} <ChevronRight aria-hidden />
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
