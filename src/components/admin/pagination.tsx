"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function Pagination({ page, pages, total, pageSize }: { page: number; pages: number; total: number; pageSize: number }) {
  const c = useTranslations("common");
  const sp = useSearchParams();
  const pathname = usePathname();
  const href = (p: number) => {
    const next = new URLSearchParams(sp.toString());
    next.set("page", String(p));
    return `${pathname}?${next.toString()}`;
  };
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="mt-4 flex items-center justify-between gap-2 text-sm text-muted-foreground">
      <span>{c("showing", { from, to, total })}</span>
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm" aria-disabled={page <= 1} className={page <= 1 ? "pointer-events-none opacity-50" : ""}>
          <Link href={href(Math.max(1, page - 1))} aria-label={c("previous")}>
            <ChevronLeft aria-hidden />
          </Link>
        </Button>
        <span>{c("page", { page, pages })}</span>
        <Button asChild variant="outline" size="sm" aria-disabled={page >= pages} className={page >= pages ? "pointer-events-none opacity-50" : ""}>
          <Link href={href(Math.min(pages, page + 1))} aria-label={c("next")}>
            <ChevronRight aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  );
}
