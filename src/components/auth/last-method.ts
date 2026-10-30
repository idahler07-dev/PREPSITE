"use client";

import { useEffect, useState } from "react";

/** The sign-in method used last on this device, shown as a "Last used" badge. */
export type LoginMethod = "google" | "telegram" | "email";

const KEY = "auth:last-method";

export function rememberMethod(method: LoginMethod) {
  try {
    localStorage.setItem(KEY, method);
  } catch {}
}

export function useLastMethod() {
  const [last, setLast] = useState<LoginMethod | null>(null);
  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v === "google" || v === "telegram" || v === "email") setLast(v);
    } catch {}
  }, []);
  return last;
}
