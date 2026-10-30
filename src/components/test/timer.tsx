"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function fmt(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0");
  return h ? `${h}:${mm}:${String(s).padStart(2, "0")}` : `${mm}:${String(s).padStart(2, "0")}`;
}

/**
 * Countdown to a server deadline. The server clock is the reference (offset
 * measured on load), so changing the device clock doesn't add time.
 */
export function CountdownTimer({
  deadline,
  serverNow,
  warningSec,
  onExpire,
}: {
  deadline: string;
  serverNow: string;
  warningSec: number;
  onExpire: () => void;
}) {
  const t = useTranslations("test.timer");
  const [offset] = useState(() => new Date(serverNow).getTime() - Date.now());
  const end = new Date(deadline).getTime();
  const [remaining, setRemaining] = useState(() => end - (Date.now() + offset));
  const [hidden, setHidden] = useState(false);
  const warned = useRef(false);
  const expired = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const tick = () => {
      const left = end - (Date.now() + offset);
      setRemaining(left);
      if (!warned.current && left <= warningSec * 1000 && left > 0) {
        warned.current = true;
        setHidden(false);
        toast.warning(t("warning"));
      }
      if (!expired.current && left <= 0) {
        expired.current = true;
        onExpireRef.current();
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [end, offset, warningSec, t]);

  const low = remaining <= warningSec * 1000;
  return (
    <div className="flex items-center gap-2">
      {hidden ? (
        <Button variant="ghost" size="sm" onClick={() => setHidden(false)}>
          <Clock aria-hidden /> {t("show")}
        </Button>
      ) : (
        <>
          <span
            role="timer"
            aria-label={t("remaining")}
            aria-live={low ? "polite" : "off"}
            className={cn("rounded-md px-2 py-1 font-mono text-lg font-semibold tabular-nums", low && "bg-danger-muted text-foreground")}
          >
            {fmt(remaining)}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setHidden(true)}>
            {t("hide")}
          </Button>
        </>
      )}
    </div>
  );
}
