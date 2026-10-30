"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { DEMO_BANNER_COOKIE } from "@/lib/demo-banner";


export function DemoBannerBar({ text, dismissLabel }: { text: string; dismissLabel: string }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div className="relative flex h-8 shrink-0 items-center justify-center bg-primary px-10 text-xs font-medium text-primary-foreground">
      <p className="truncate">{text}</p>
      <button
        type="button"
        onClick={() => {
          setHidden(true);
          // No max-age: a session cookie, gone when the browser closes.
          document.cookie = `${DEMO_BANNER_COOKIE}=hidden; path=/; samesite=lax`;
        }}
        aria-label={dismissLabel}
        className="absolute end-2 flex size-6 items-center justify-center rounded-full transition-colors hover:bg-primary-foreground/15 focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:outline-none"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
