"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Original PDF pages (rendered images) with page navigation and zoom. */
export function PageViewer({ fileName, pages, initialPage }: { fileName: string; pages: { id: string; pageNumber: number; hasImage: boolean }[]; initialPage: number }) {
  const t = useTranslations("admin.importReview");
  const start = Math.max(0, pages.findIndex((p) => p.pageNumber === initialPage));
  const [index, setIndex] = useState(start);
  const [zoomed, setZoomed] = useState(false);
  const page = pages[index];
  if (!page) return <p className="text-sm text-muted-foreground">{t("noImage")}</p>;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="truncate text-sm font-semibold">{t("pageOf", { file: fileName, page: page.pageNumber })}</h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => setIndex((i) => i - 1)} aria-label={t("previousPage")}>
            <ChevronLeft aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" disabled={index === pages.length - 1} onClick={() => setIndex((i) => i + 1)} aria-label={t("nextPage")}>
            <ChevronRight aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setZoomed((z) => !z)} aria-label={zoomed ? t("zoomOut") : t("zoomIn")} aria-pressed={zoomed}>
            {zoomed ? <Minimize2 aria-hidden /> : <Maximize2 aria-hidden />}
          </Button>
        </div>
      </div>
      <div className={cn("overflow-auto rounded-md border bg-white", zoomed ? "max-h-[80vh]" : "max-h-[75vh]")}>
        {page.hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={page.id}
            src={`/api/manage/import-pages/${page.id}/image`}
            alt={t("pageOf", { file: fileName, page: page.pageNumber })}
            className={cn("block h-auto", zoomed ? "w-[200%] max-w-none" : "w-full")}
          />
        ) : (
          <p className="p-6 text-sm text-muted-foreground">{t("noImage")}</p>
        )}
      </div>
    </div>
  );
}
