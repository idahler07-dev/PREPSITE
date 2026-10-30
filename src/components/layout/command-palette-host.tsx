"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// The palette (cmdk + dialog) loads the first time it's opened, not with every page.
const CommandPalette = dynamic(() => import("./command-palette").then((m) => m.CommandPalette), { ssr: false });

/** Listens for Ctrl/Cmd + K and the search button; mounts the palette on first use. */
export function CommandPaletteHost({ signedIn }: { signedIn: boolean }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ready) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setReady(true);
        // Let the palette mount, then open it.
        requestAnimationFrame(() => setTimeout(() => window.dispatchEvent(new Event("open-command-palette")), 60));
      }
    };
    const onOpen = () => setReady(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette-request", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette-request", onOpen);
    };
  }, [ready]);
  return ready ? <CommandPalette signedIn={signedIn} openOnMount /> : null;
}
