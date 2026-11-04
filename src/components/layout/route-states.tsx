"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";

/**
 * Loading screen for route changes: one calm centred panel, the Satify mark
 * breathing gently over a slim sliding bar. No placeholder boxes.
 */
export function PageSkeleton() {
  const t = useTranslations("common");
  return (
    <div role="status" aria-live="polite" className="flex min-h-[60dvh] flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- static brand mark, no layout needed */}
      <img src="/brand/mark.svg" alt="" width={64} height={64} className="loading-breathe size-16 rounded-2xl" />
      <div className="loading-bar" aria-hidden />
      <p className="text-sm text-muted-foreground">{t("loading")}</p>
    </div>
  );
}

/** Generic error state with a retry (used by the error.tsx files). */
export function RouteError({ reset }: { reset: () => void }) {
  const t = useTranslations("common");
  return (
    <Container>
      <EmptyState pose="confused" title={t("errorTitle")} body={t("errorBody")} action={<Button onClick={reset}>{t("tryAgain")}</Button>} />
    </Container>
  );
}
