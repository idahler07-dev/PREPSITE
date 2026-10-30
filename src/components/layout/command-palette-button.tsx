"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const KEY_MAC = "⌘K";
const KEY_PC = "Ctrl K";

/** Opens the palette; shows the shortcut on wide screens. */
export function CommandPaletteButton({ className }: { className?: string }) {
  const t = useTranslations("command");
  const [mac, setMac] = useState(false);
  useEffect(() => setMac(/Mac|iPhone|iPad/.test(navigator.platform)), []);
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new Event("open-command-palette-request"));
        window.dispatchEvent(new Event("open-command-palette"));
      }}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full border bg-surface px-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
        className,
      )}
    >
      <Search className="size-4" aria-hidden />
      {/* Visible on wide screens; screen-reader-only on small ones (the name always matches the text). */}
      <span className="sr-only lg:not-sr-only">{t("placeholderShort")}</span>
      <kbd className="hidden lg:inline-flex">{mac ? KEY_MAC : KEY_PC}</kbd>
    </button>
  );
}
