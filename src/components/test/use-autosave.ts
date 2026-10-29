"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface PendingUpdate {
  position: number;
  answer?: string | null;
  flagged?: boolean;
  eliminated?: string[];
  timeDeltaMs?: number;
}

export type SaveStatus = "saved" | "saving" | "offline" | "error";

const MAX_DELTA = 10 * 60_000;

/**
 * Batches answer changes and sends them to the server. Unsent changes are
 * kept in localStorage, so a reload or lost connection doesn't lose answers;
 * they are sent again when the page loads or the connection returns.
 */
export function useAutosave(attemptId: string, moduleId: string, onClosed: (reason: string) => void) {
  const storageKey = `pending:${attemptId}:${moduleId}`;
  const pending = useRef(new Map<number, PendingUpdate>());
  const inFlight = useRef<Promise<boolean> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelay = useRef(1000);
  /** Unsent changes found in localStorage when the page loaded (shown on screen by the caller). */
  const leftovers = useRef<PendingUpdate[]>([]);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const onClosedRef = useRef(onClosed);
  onClosedRef.current = onClosed;

  const persist = useCallback(() => {
    try {
      if (pending.current.size) localStorage.setItem(storageKey, JSON.stringify([...pending.current.values()]));
      else localStorage.removeItem(storageKey);
    } catch {}
  }, [storageKey]);

  const merge = useCallback((u: PendingUpdate) => {
    const prev = pending.current.get(u.position) ?? { position: u.position };
    const next: PendingUpdate = { ...prev, ...u };
    if (prev.timeDeltaMs || u.timeDeltaMs) next.timeDeltaMs = Math.min(MAX_DELTA, (prev.timeDeltaMs ?? 0) + (u.timeDeltaMs ?? 0));
    pending.current.set(u.position, next);
  }, []);

  const send = useCallback(async (): Promise<boolean> => {
    if (pending.current.size === 0) return true;
    const batch = [...pending.current.values()];
    pending.current.clear();
    setStatus("saving");
    try {
      const res = await fetch(`/api/attempts/${attemptId}/responses`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, updates: batch }),
        keepalive: true,
      });
      if (res.status === 409) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        persist();
        onClosedRef.current(body.error ?? "MODULE_CLOSED");
        return false;
      }
      if (!res.ok) throw new Error(String(res.status));
      retryDelay.current = 1000;
      persist();
      setStatus(pending.current.size ? "saving" : "saved");
      return true;
    } catch {
      // Put the batch back (newer edits win) and retry later.
      for (const u of batch) {
        const newer = pending.current.get(u.position);
        pending.current.set(u.position, newer ? { ...u, ...newer, timeDeltaMs: (u.timeDeltaMs ?? 0) + (newer.timeDeltaMs ?? 0) } : u);
      }
      persist();
      setStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), retryDelay.current);
      retryDelay.current = Math.min(retryDelay.current * 2, 30_000);
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, moduleId, persist]);

  const flush = useCallback(async (): Promise<boolean> => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    while (inFlight.current) await inFlight.current;
    if (pending.current.size === 0) return true;
    inFlight.current = send();
    try {
      return await inFlight.current;
    } finally {
      inFlight.current = null;
    }
  }, [send]);

  const queue = useCallback(
    (u: PendingUpdate, { immediate = false } = {}) => {
      merge(u);
      persist();
      setStatus((s) => (s === "offline" || s === "error" ? s : "saving"));
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), immediate ? 0 : 600);
    },
    [merge, persist, flush],
  );

  // Send anything left over from a previous visit, and retry when back online.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as PendingUpdate[];
      leftovers.current = saved;
      for (const u of saved) merge(u);
    } catch {}
    if (pending.current.size) void flush();
    const online = () => void flush();
    const hide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    window.addEventListener("online", online);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("online", online);
      document.removeEventListener("visibilitychange", hide);
    };
  }, [storageKey, merge, flush]);

  /** Unsent changes restored from localStorage (applied over server state on load). */
  const restored = useCallback(() => leftovers.current, []);

  return { queue, flush, status, restored };
}
