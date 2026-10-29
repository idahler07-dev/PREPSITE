"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { evaluate, formatResult, type AngleMode } from "@/lib/calc";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FloatingPanel } from "./floating-panel";

declare global {
  interface Window {
    Desmos?: { GraphingCalculator: (el: HTMLElement, opts: Record<string, unknown>) => { destroy: () => void; getState: () => unknown; setState: (s: unknown) => void } };
  }
}

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

/** Desmos graphing calculator (official API). Its state is kept per attempt so graphs survive question changes. */
function DesmosCalculator({ apiKey, stateKey, onFail }: { apiKey: string; stateKey: string; onFail: () => void }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let calc: ReturnType<NonNullable<Window["Desmos"]>["GraphingCalculator"]> | null = null;
    let cancelled = false;
    loadDesmos(apiKey)
      .then(() => {
        if (cancelled || !el.current || !window.Desmos) return;
        calc = window.Desmos.GraphingCalculator(el.current, { keypad: true, expressions: true, settingsMenu: false, links: false, border: false });
        try {
          const saved = sessionStorage.getItem(stateKey);
          if (saved) calc.setState(JSON.parse(saved));
        } catch {}
      })
      .catch(onFail);
    return () => {
      cancelled = true;
      if (calc) {
        try {
          sessionStorage.setItem(stateKey, JSON.stringify(calc.getState()));
        } catch {}
        calc.destroy();
      }
    };
  }, [apiKey, stateKey, onFail]);
  return <div ref={el} className="h-full w-full" />;
}

const KEYS = [
  ["sin(", "cos(", "tan(", "π", "e"],
  ["sqrt(", "^", "(", ")", "%"],
  ["7", "8", "9", "÷", "ln("],
  ["4", "5", "6", "×", "log("],
  ["1", "2", "3", "−", "ans"],
  ["0", ".", "=", "+", "abs("],
];

/** Basic scientific calculator, used when no Desmos key is set or Desmos can't load. */
export function BasicCalculator() {
  const t = useTranslations("test.calculator");
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [ans, setAns] = useState(0);
  const [angle, setAngle] = useState<AngleMode>("deg");
  const [history, setHistory] = useState<{ expr: string; result: string }[]>([]);
  const input = useRef<HTMLInputElement>(null);

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
      <div className="flex items-center justify-between gap-2">
        <div className="flex rounded-md border p-0.5" role="group" aria-label={t("angle")}>
          {(["deg", "rad"] as const).map((m) => (
            <button key={m} type="button" aria-pressed={angle === m} onClick={() => setAngle(m)} className={cn("rounded px-2 py-0.5 text-xs", angle === m && "bg-primary text-primary-foreground")}>
              {t(m)}
            </button>
          ))}
        </div>
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
            {k.replace("(", "")}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function CalculatorPanel({ desmosKey, attemptId, onClose }: { desmosKey: string | null; attemptId: string; onClose: () => void }) {
  const t = useTranslations("test.calculator");
  const [desmosFailed, setDesmosFailed] = useState(false);
  const onFail = useCallback(() => setDesmosFailed(true), []);
  const useDesmos = !!desmosKey && !desmosFailed;
  return (
    <FloatingPanel id={useDesmos ? "desmos" : "calc"} title={useDesmos ? t("graphing") : t("title")} closeLabel={t("close")} onClose={onClose} initial={useDesmos ? { width: 520, height: 560 } : { width: 320, height: 520 }}>
      {useDesmos ? <DesmosCalculator apiKey={desmosKey} stateKey={`desmos:${attemptId}`} onFail={onFail} /> : <BasicCalculator />}
    </FloatingPanel>
  );
}
