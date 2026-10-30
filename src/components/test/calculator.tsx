"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, m, useDragControls, useReducedMotion, type DragControls, type PanInfo } from "motion/react";
import { ChevronDown, PanelLeft, PanelRight, X } from "lucide-react";
import { evaluate, formatResult, type AngleMode } from "@/lib/calc";
import { Button } from "@/components/ui/button";
import { fade, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/use-media-query";

/*
 * The official Desmos calculators (https://www.desmos.com/api), set up like
 * the digital SAT: expression list and keypad on, settings menu, links,
 * images, notes and folders off, zoom buttons on, and a degree/radian toggle.
 * One instance per test session: it stays alive while the panel is closed,
 * and its state is saved to sessionStorage and, debounced, with the attempt.
 */

type DesmosCalc = {
  destroy: () => void;
  getState: () => unknown;
  setState: (s: unknown) => void;
  resize: () => void;
  updateSettings: (s: Record<string, unknown>) => void;
  observeEvent: (name: "change", cb: () => void) => void;
};

declare global {
  interface Window {
    Desmos?: {
      GraphingCalculator: (el: HTMLElement, opts: Record<string, unknown>) => DesmosCalc;
      ScientificCalculator: (el: HTMLElement, opts: Record<string, unknown>) => DesmosCalc;
    };
  }
}

/** Latest stable API version. */
const DESMOS_SRC = (key: string) => `https://www.desmos.com/api/v1.11/calculator.js?apiKey=${encodeURIComponent(key)}`;
let desmosLoading: Promise<void> | null = null;

function loadDesmos(key: string): Promise<void> {
  if (window.Desmos) return Promise.resolve();
  desmosLoading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = DESMOS_SRC(key);
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      desmosLoading = null;
      reject(new Error("desmos"));
    };
    document.head.appendChild(s);
  });
  return desmosLoading;
}

const GRAPHING_OPTIONS = {
  expressions: true,
  keypad: true,
  settingsMenu: false,
  links: false,
  pasteGraphLink: false,
  images: false,
  notes: false,
  folders: false,
  zoomButtons: true,
  expressionsTopbar: true,
  border: false,
};
const SCIENTIFIC_OPTIONS = { keypad: true, links: false, settingsMenu: false, border: false };

/**
 * Whether this document's Content Security Policy lets Desmos compile expressions.
 * Only pages loaded at /test/* allow it; arriving by a client-side navigation
 * from another page keeps that page's stricter policy.
 */
function canEval(): boolean {
  try {
    return new Function("return true")() === true;
  } catch {
    return false;
  }
}

type Tab = "graphing" | "scientific";
interface SavedState {
  graphing?: unknown;
  scientific?: unknown;
  tab?: Tab;
  degrees?: boolean;
}

function readSession(key: string): SavedState | null {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? "null") as SavedState | null;
  } catch {
    return null;
  }
}

/** Both Desmos calculators in one host; the scientific one is created the first time its tab opens. */
function DesmosHost({
  apiKey,
  attemptId,
  initialState,
  tab,
  degrees,
  onFail,
  onNeedsReload,
}: {
  apiKey: string;
  attemptId: string;
  initialState: SavedState | null;
  tab: Tab;
  degrees: boolean;
  onFail: () => void;
  /** Called (instead of loading) when the page must be reloaded for Desmos to run; null when a reload already happened. */
  onNeedsReload: (() => void) | null;
}) {
  const graphEl = useRef<HTMLDivElement>(null);
  const sciEl = useRef<HTMLDivElement>(null);
  const graph = useRef<DesmosCalc | null>(null);
  const sci = useRef<DesmosCalc | null>(null);
  const [ready, setReady] = useState(false);
  const sessionKey = `calc:${attemptId}`;
  const saved = useRef<SavedState>(readSession(sessionKey) ?? initialState ?? {});
  const serverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useRef(() => {});
  persist.current = () => {
    const state: SavedState = {
      graphing: graph.current?.getState() ?? saved.current.graphing,
      scientific: sci.current?.getState() ?? saved.current.scientific,
      tab,
      degrees,
    };
    saved.current = state;
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify(state));
    } catch {}
    if (serverTimer.current) clearTimeout(serverTimer.current);
    serverTimer.current = setTimeout(() => {
      void fetch(`/api/attempts/${attemptId}/calculator`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(state) }).catch(() => {});
    }, 2000);
  };

  useEffect(() => {
    let cancelled = false;
    if (!canEval()) {
      if (onNeedsReload) onNeedsReload();
      else onFail();
      return;
    }
    loadDesmos(apiKey)
      .then(() => {
        if (cancelled || !graphEl.current || !window.Desmos) return;
        graph.current = window.Desmos.GraphingCalculator(graphEl.current, { ...GRAPHING_OPTIONS, degreeMode: degrees });
        try {
          if (saved.current.graphing) graph.current.setState(saved.current.graphing);
        } catch {}
        graph.current.updateSettings({ degreeMode: degrees });
        graph.current.observeEvent("change", () => persist.current());
        setReady(true);
      })
      .catch((e: unknown) => {
        console.error("[desmos] could not start, using the built-in calculator", e);
        onFail();
      });
    return () => {
      cancelled = true;
      persist.current();
      graph.current?.destroy();
      sci.current?.destroy();
      graph.current = sci.current = null;
    };
    // One instance for the whole session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || tab !== "scientific" || sci.current || !sciEl.current || !window.Desmos) return;
    sci.current = window.Desmos.ScientificCalculator(sciEl.current, { ...SCIENTIFIC_OPTIONS, degreeMode: degrees });
    try {
      if (saved.current.scientific) sci.current.setState(saved.current.scientific);
    } catch {}
    sci.current.updateSettings({ degreeMode: degrees });
    sci.current.observeEvent("change", () => persist.current());
  }, [ready, tab, degrees]);

  useEffect(() => {
    graph.current?.updateSettings({ degreeMode: degrees });
    sci.current?.updateSettings({ degreeMode: degrees });
    if (ready) persist.current();
  }, [degrees, ready, tab]);

  // Desmos needs resize() whenever its box changes size (dock resize, sheet, tab switch).
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      graph.current?.resize();
      sci.current?.resize();
    });
    if (graphEl.current?.parentElement) ro.observe(graphEl.current.parentElement);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={graphEl} className={cn("absolute inset-0", tab !== "graphing" && "invisible")} />
      <div ref={sciEl} className={cn("absolute inset-0", tab !== "scientific" && "invisible")} />
    </div>
  );
}

const KEYS = [
  ["sin(", "cos(", "tan(", "π", "e"],
  ["sqrt(", "^", "(", ")", "%"],
  ["7", "8", "9", "÷", "ln("],
  ["4", "5", "6", "×", "log("],
  ["1", "2", "3", "−", "ans"],
  ["0", ".", "=", "+", "abs("],
];

/** Our own scientific calculator, used only when Desmos has no key or can't load. */
export function BasicCalculator({ degrees }: { degrees: boolean }) {
  const t = useTranslations("test.calculator");
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [ans, setAns] = useState(0);
  const [history, setHistory] = useState<{ expr: string; result: string }[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const angle: AngleMode = degrees ? "deg" : "rad";

  function run() {
    if (!expr.trim()) return;
    try {
      const v = evaluate(expr, { angle, ans });
      const shown = formatResult(v);
      setResult(shown);
      setError(false);
      setAns(v);
      setHistory((h) => [{ expr, result: shown }, ...h].slice(0, 20));
      setExpr("");
    } catch {
      setError(true);
      setResult(null);
    }
  }
  function press(k: string) {
    if (k === "=") return run();
    setExpr((e) => e + k);
    setError(false);
    input.current?.focus();
  }

  return (
    <div className="flex h-full flex-col gap-2 p-3 text-sm">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => (setExpr(""), setResult(null), setError(false))}>
          {t("clear")}
        </Button>
      </div>
      <ol className="min-h-10 flex-1 space-y-1 overflow-y-auto rounded-md bg-muted p-2 font-mono text-xs" aria-label={t("history")}>
        {history.map((h, i) => (
          <li key={i} className="flex justify-between gap-2">
            <button type="button" className="truncate text-left text-muted-foreground hover:underline" onClick={() => setExpr(h.expr)}>
              {h.expr}
            </button>
            <button type="button" className="font-semibold hover:underline" onClick={() => setExpr((e) => e + h.result)}>
              = {h.result}
            </button>
          </li>
        ))}
      </ol>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <label htmlFor="calc-input" className="sr-only">
          {t("expression")}
        </label>
        <input
          ref={input}
          id="calc-input"
          value={expr}
          onChange={(e) => (setExpr(e.target.value), setError(false))}
          autoComplete="off"
          spellCheck={false}
          inputMode="none"
          className={cn("w-full rounded-md border bg-background px-2 py-1.5 text-right font-mono text-base", error && "border-destructive")}
          aria-invalid={error}
          aria-describedby="calc-result"
        />
      </form>
      <p id="calc-result" aria-live="polite" className={cn("h-5 text-right font-mono", error && "text-destructive")}>
        {error ? t("error") : result !== null ? `= ${result}` : ""}
      </p>
      <div className="grid grid-cols-5 gap-1">
        {KEYS.flat().map((k) => (
          <Button key={k} type="button" variant={k === "=" ? "default" : "outline"} size="sm" className="h-9 px-0 font-mono" onClick={() => press(k === "ans" ? "ans" : k)}>
            {k.length > 1 ? k.replace("(", "") : k}
          </Button>
        ))}
      </div>
    </div>
  );
}

const DOCK_KEY = "calc-dock";
const MIN_W = 320;
const maxWidth = () => Math.max(MIN_W, Math.min(760, Math.round(window.innerWidth * 0.6)));

/**
 * The calculator panel. Desktop: docked to the left (or right) of the test,
 * resizable from its inner edge and draggable to the other side; the question
 * reflows next to it. Phones: a full-height bottom sheet with a drag handle.
 * Mounted on first open and kept alive after that (one Desmos instance).
 */
export function CalculatorPanel({
  open,
  onClose,
  desmosKey,
  demoKey = false,
  attemptId,
  initialState,
  side,
  onSideChange,
  onNeedsReload = null,
}: {
  open: boolean;
  onClose: () => void;
  desmosKey: string | null;
  demoKey?: boolean;
  attemptId: string;
  initialState: unknown;
  side: "left" | "right";
  onSideChange: (s: "left" | "right") => void;
  onNeedsReload?: (() => void) | null;
}) {
  const t = useTranslations("test.calculator");
  const reduce = useReducedMotion();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const sheetDrag = useDragControls();
  const [mounted, setMounted] = useState(open);
  const [failed, setFailed] = useState(false);
  const init = (initialState ?? null) as SavedState | null;
  const [tab, setTab] = useState<Tab>(init?.tab ?? "graphing");
  const [degrees, setDegrees] = useState(init?.degrees ?? true);
  const [width, setWidth] = useState(420);
  const [dragX, setDragX] = useState<number | null>(null);
  const useDesmos = !!desmosKey && !failed;

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);
  useEffect(() => {
    if (demoKey) console.warn("[Satify] Using the Desmos demo API key (development only). Set NEXT_PUBLIC_DESMOS_API_KEY for production.");
  }, [demoKey]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DOCK_KEY) ?? "null") as { width?: number } | null;
      if (saved?.width) setWidth(Math.min(maxWidth(), Math.max(MIN_W, saved.width)));
    } catch {}
  }, []);
  const saveDock = (w: number) => {
    try {
      localStorage.setItem(DOCK_KEY, JSON.stringify({ width: w }));
    } catch {}
  };

  if (!mounted) return null;

  function startResize(e: React.PointerEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = width;
    const dir = side === "left" ? 1 : -1;
    let w = startW;
    const move = (ev: PointerEvent) => {
      w = Math.min(maxWidth(), Math.max(MIN_W, startW + (ev.clientX - startX) * dir));
      setWidth(w);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      saveDock(w);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function startMove(e: React.PointerEvent) {
    if (!desktop || (e.target as HTMLElement).closest("button")) return;
    const move = (ev: PointerEvent) => setDragX(ev.clientX);
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setDragX(null);
      onSideChange(ev.clientX > window.innerWidth / 2 ? "right" : "left");
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const header = (
    <div className={cn("flex h-12 shrink-0 items-center gap-1 border-b px-2 select-none", desktop && "cursor-grab active:cursor-grabbing")} onPointerDown={startMove}>
      {useDesmos ? (
      <div role="tablist" aria-label={t("title")} className="flex rounded-lg bg-surface-2 p-0.5">
        {(["graphing", "scientific"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn("rounded-md px-2 py-1 text-xs font-medium transition-colors sm:px-2.5", tab === k ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            {t(k)}
          </button>
        ))}
      </div>
      ) : (
        <span className="px-1 text-small font-semibold">{t("scientific")}</span>
      )}
      <div className="ms-1 flex rounded-lg border p-0.5 sm:ms-2" role="group" aria-label={t("angle")}>
        {([true, false] as const).map((d) => (
          <button
            key={String(d)}
            type="button"
            aria-pressed={degrees === d}
            onClick={() => setDegrees(d)}
            className={cn("rounded-md px-2 py-0.5 text-xs", degrees === d ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
          >
            {d ? t("deg") : t("rad")}
          </button>
        ))}
      </div>
      <div className="ms-auto flex items-center">
        {desktop && (
          <Button variant="ghost" size="icon" className="size-8" onClick={() => onSideChange(side === "left" ? "right" : "left")} aria-label={side === "left" ? t("dockRight") : t("dockLeft")} title={side === "left" ? t("dockRight") : t("dockLeft")}>
            {side === "left" ? <PanelRight aria-hidden /> : <PanelLeft aria-hidden />}
          </Button>
        )}
        {desktop ? (
          <Button variant="ghost" size="icon" className="size-8" onClick={onClose} aria-label={t("close")} title={t("close")}>
            <X aria-hidden />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="px-2" onClick={onClose}>
            <ChevronDown aria-hidden /> {t("hide")}
          </Button>
        )}
      </div>
    </div>
  );

  const body = useDesmos ? (
    <DesmosHost
      apiKey={desmosKey!}
      attemptId={attemptId}
      initialState={init}
      tab={tab}
      degrees={degrees}
      onFail={() => setFailed(true)}
      onNeedsReload={onNeedsReload}
    />
  ) : (
    <div className="min-h-0 flex-1 overflow-auto">
      <BasicCalculator degrees={degrees} />
    </div>
  );

  if (desktop) {
    return (
      <m.aside
        aria-label={t("title")}
        aria-hidden={!open}
        inert={!open}
        className={cn("relative flex h-full shrink-0 overflow-hidden bg-surface", side === "left" ? "order-first border-e" : "order-last border-s")}
        initial={false}
        animate={{ width: open ? width : 0 }}
        transition={reduce ? { duration: 0 } : spring.snappy}
        style={dragX !== null ? { opacity: 0.85 } : undefined}
      >
        <div className="flex h-full flex-col" style={{ width }}>
          {header}
          {body}
        </div>
        {/* Resize handle on the inner edge. */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={t("resize")}
          aria-valuemin={MIN_W}
          aria-valuemax={760}
          aria-valuenow={width}
          tabIndex={0}
          onPointerDown={startResize}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 60 : 20;
            const dir = side === "left" ? 1 : -1;
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault();
              const w = Math.min(maxWidth(), Math.max(MIN_W, width + (e.key === "ArrowRight" ? step : -step) * dir));
              setWidth(w);
              saveDock(w);
            }
          }}
          className={cn(
            "group absolute top-0 bottom-0 z-10 flex w-3 cursor-col-resize items-center justify-center focus-visible:outline-none",
            side === "left" ? "-end-1.5" : "-start-1.5",
          )}
        >
          <span className="h-10 w-1 rounded-full bg-border transition-colors group-hover:bg-primary group-focus-visible:bg-primary" aria-hidden />
        </div>
      </m.aside>
    );
  }

  // Phones and tablets: a bottom sheet, kept mounted (hidden) after closing.
  return (
    <>
      <AnimatePresence>
        {open && <m.div key="scrim" className="fixed inset-0 z-40 bg-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade} onClick={onClose} aria-hidden />}
      </AnimatePresence>
      <m.section
        aria-label={t("title")}
        aria-hidden={!open}
        inert={!open}
        className="fixed inset-x-0 bottom-0 z-50 flex h-[92dvh] flex-col overflow-hidden rounded-t-2xl border-t bg-surface pb-[env(safe-area-inset-bottom)] shadow-xl"
        initial={false}
        animate={open ? { y: 0 } : { y: "105%" }}
        transition={reduce ? { duration: 0 } : spring.soft}
        drag={open && !reduce ? "y" : false}
        dragListener={false}
        dragControls={sheetDrag}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_: unknown, info: PanInfo) => {
          if (info.offset.y > 120 || info.velocity.y > 500) onClose();
        }}
      >
        <DragHandle controls={sheetDrag} />
        {header}
        {body}
      </m.section>
    </>
  );
}

/** The grab bar at the top of the phone sheet. Dragging the sheet is done from here so Desmos keeps its own gestures. */
function DragHandle({ controls }: { controls: DragControls }) {
  return (
    <div className="flex h-6 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing" onPointerDown={(e) => controls.start(e)} aria-hidden>
      <span className="h-1.5 w-10 rounded-full bg-border" />
    </div>
  );
}
