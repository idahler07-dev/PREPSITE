"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FloatingOtto } from "@/components/mascot/floating-otto";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="mx-auto flex min-h-[70dvh] max-w-xl flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <FloatingOtto pose="juggle" className="w-40" />
      <h1 className="text-h2 font-semibold">{t("errorTitle")}</h1>
      <p className="text-lead text-muted-foreground">{t("errorBody")}</p>
      <Button onClick={reset} size="lg" className="rounded-full">
        {t("tryAgain")}
      </Button>
    </main>
  );
}
