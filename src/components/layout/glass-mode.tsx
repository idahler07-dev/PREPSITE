"use client";

import { useEffect } from "react";

/** Phones and laptops that struggle with blur get solid panels (see html[data-glass="solid"] in globals.css). */
export function GlassMode() {
  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const weak = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
    if (weak) document.documentElement.dataset.glass = "solid";
  }, []);
  return null;
}
