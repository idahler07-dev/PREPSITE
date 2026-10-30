"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";

/** Generic page skeleton: a title, a row of tiles and a list (used by the loading.tsx files). */
export function PageSkeleton() {
  return (
    <Container className="space-y-6">
      <div className="contents" aria-busy="true" aria-live="polite">
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-[20px]" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
      </div>
    </Container>
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
