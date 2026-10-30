"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";

export default function BankError({ reset }: { reset: () => void }) {
  const t = useTranslations("common");
  return (
    <Container>
      <EmptyState pose="confused" title={t("errorTitle")} body={t("errorBody")} action={<Button onClick={reset}>{t("tryAgain")}</Button>} />
    </Container>
  );
}
