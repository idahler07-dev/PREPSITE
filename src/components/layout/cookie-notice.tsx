"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

const KEY = "cookie-notice-v1";

/** We only use essential cookies, so this is a notice, not a consent form. */
export function CookieNotice() {
  const t = useTranslations("cookie");
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      setShow(!localStorage.getItem(KEY));
    } catch {}
  }, []);
  if (!show) return null;
  return (
    <div role="region" aria-label={t("message")} className="fixed inset-x-0 bottom-0 z-50 p-3 sm:bottom-4 sm:start-4 sm:end-auto sm:max-w-sm">
      <div className="flex items-center gap-3 rounded-lg border bg-popover p-3 text-sm text-popover-foreground shadow-lg">
        <p className="flex-1">{t("message")}</p>
        <Button
          size="sm"
          onClick={() => {
            try {
              localStorage.setItem(KEY, "1");
            } catch {}
            setShow(false);
          }}
        >
          {t("accept")}
        </Button>
      </div>
    </div>
  );
}
