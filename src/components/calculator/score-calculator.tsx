"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, m, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { ArrowRight, Minus, Plus, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Owl, type OwlPose } from "@/components/mascot/owl";
import { Odometer } from "@/components/motion/odometer";
import { MODULE_SIZE, clampRaw, likelyRoute, planFor, totalScore, type Route, type SectionInput } from "@/lib/scoreEstimate";
import type { SectionKey } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

const SPRING = { type: "spring", stiffness: 400, damping: 30 } as const;

/**
 * Public Digital SAT score calculator. Two modes: estimate from right answers,
 * or "what do I need" for a target. Live updates; the owl thinks while you
 * slide and cheers once you reach the target.
 */
export function ScoreCalculator({ ctaHref }: { ctaHref: string }) {
  const t = useTranslations("calc");
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<"estimate" | "target">("estimate");
  const [rw, setRw] = useState<SectionInput>({ m1: 20, m2: 18, route: "harder" });
  const [math, setMath] = useState<SectionInput>({ m1: 16, m2: 14, route: "harder" });
  const [target, setTarget] = useState(1400);
  const [sliding, setSliding] = useState(false);
  const idle = useRef<ReturnType<typeof setTimeout>>(undefined);

  function touch() {
    setSliding(true);
    clearTimeout(idle.current);
    idle.current = setTimeout(() => setSliding(false), 650);
  }
  useEffect(() => () => clearTimeout(idle.current), []);

  const est = useMemo(() => totalScore(rw, math), [rw, math]);
  const plan = useMemo(() => planFor(target), [target]);
  const shownTotal = mode === "estimate" ? est.total : target;
  const shownRw = mode === "estimate" ? est.rw : (plan?.rw.score ?? 200);
  const shownMath = mode === "estimate" ? est.math : (plan?.math.score ?? 200);
  const reached = mode === "estimate" && est.total >= target;
  const pose: OwlPose = sliding ? "thinking" : reached ? "correct" : "happy";

  function update(section: SectionKey, patch: Partial<SectionInput>) {
    touch();
    const set = section === "RW" ? setRw : setMath;
    set((prev) => {
      const next = { ...prev, ...patch };
      // Moving module 1 picks the route you'd most likely get, until you choose one yourself.
      if (patch.m1 !== undefined && patch.route === undefined) next.route = likelyRoute(section, next.m1);
      return next;
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
      <div className="space-y-4">
        <LayoutGroup id="calc-mode">
          <div role="tablist" aria-label={t("title")} className="flex w-full rounded-2xl border border-border bg-surface p-1 shadow-sm sm:w-fit">
            {(["estimate", "target"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={mode === k}
                onClick={() => setMode(k)}
                className={cn("relative flex-1 rounded-xl px-5 py-2 font-display text-sm font-extrabold transition-colors sm:flex-none", mode === k ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                {mode === k && <m.span layoutId="calc-pill" className="absolute inset-0 rounded-xl bg-primary shadow-[0_3px_0_var(--primary-edge)]" transition={reduce ? { duration: 0 } : SPRING} />}
                <span className="relative">{k === "estimate" ? t("modeEstimate") : t("modeTarget")}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>

        <AnimatePresence mode="wait" initial={false}>
          {mode === "estimate" ? (
            <m.div key="estimate" className="space-y-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={SPRING}>
              <SectionCard section="RW" title={t("rw")} value={rw} onChange={(p) => update("RW", p)} score={est.rw} tone="var(--review)" />
              <SectionCard section="MATH" title={t("math")} value={math} onChange={(p) => update("MATH", p)} score={est.math} tone="var(--primary)" />
            </m.div>
          ) : (
            <m.div key="target" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={SPRING} className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6">
              <div className="flex items-baseline justify-between">
                <label htmlFor="target" className="font-display text-lg font-extrabold">
                  {t("target")}
                </label>
                <span className="font-display text-3xl font-extrabold text-primary tabular-nums">{target}</span>
              </div>
              <input
                id="target"
                type="range"
                min={400}
                max={1600}
                step={10}
                value={target}
                onChange={(e) => {
                  touch();
                  setTarget(+e.target.value);
                }}
                className="range mt-4"
                style={{ ["--fill" as string]: `${((target - 400) / 1200) * 100}%` }}
              />
              {plan && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-muted-foreground">{t("need")}</p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {[
                      { label: t("rw"), p: plan.rw, tone: "bg-review" },
                      { label: t("math"), p: plan.math, tone: "bg-primary" },
                    ].map((r) => (
                      <div key={r.label} className="rounded-2xl border border-border p-4">
                        <p className="text-sm text-muted-foreground">{r.label}</p>
                        <p className="font-display text-xl font-extrabold tabular-nums">{t("needRow", { correct: r.p.correct, of: r.p.of })}</p>
                        <span className="mt-2 block h-2 overflow-hidden rounded-full bg-surface-2">
                          <m.span className={cn("block h-full rounded-full", r.tone)} animate={{ width: `${(r.p.correct / r.p.of) * 100}%` }} transition={SPRING} />
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{t("needHint")}</p>
                </div>
              )}
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {/* Result */}
      <div className="rounded-3xl border border-border bg-surface p-5 shadow-[0_24px_50px_-30px_rgb(15_23_42/0.3)] sm:p-6 lg:sticky lg:top-24 dark:shadow-none">
        <div className="relative">
          <div className="absolute -top-3 -right-2 w-[68px] sm:w-[76px]">
            <Owl pose={pose} className="w-full" />
          </div>
          <Gauge value={shownTotal} />
          <div className="-mt-16 text-center sm:-mt-[4.5rem]" aria-live="polite">
            <Odometer value={shownTotal} className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl" />
            <p className="text-sm text-muted-foreground">{t("total")}</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Ring label={t("rwShort")} value={shownRw} tone="var(--review)" />
          <Ring label={t("math")} value={shownMath} tone="var(--primary)" />
        </div>
        {mode === "estimate" && (
          <p className={cn("mt-4 text-center text-sm font-semibold", reached ? "text-correct-ink" : "text-muted-foreground")}>
            {reached ? t("reached") : t("away", { points: target - est.total })}
          </p>
        )}
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <Button asChild size="lg">
            <Link href={ctaHref}>
              {t("cta")}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
          <ShareButton total={shownTotal} rw={shownRw} math={shownMath} />
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">{t("note")}</p>
      </div>
    </div>
  );
}

function SectionCard({ section, title, value, onChange, score, tone }: { section: SectionKey; title: string; value: SectionInput; onChange: (p: Partial<SectionInput>) => void; score: number; tone: string }) {
  const t = useTranslations("calc");
  const max = MODULE_SIZE[section];
  return (
    <section className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6" style={{ ["--track" as string]: tone }}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-extrabold">{title}</h2>
        <span className="font-display text-2xl font-extrabold tabular-nums" style={{ color: tone }}>
          {score}
        </span>
      </div>
      <div className="space-y-5">
        <RawRow id={`${section}-m1`} label={t("m1")} max={max} value={value.m1} onChange={(m1) => onChange({ m1 })} />
        <RawRow id={`${section}-m2`} label={t("m2")} max={max} value={value.m2} onChange={(m2) => onChange({ m2 })} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-semibold text-muted-foreground">{t("route")}</span>
          <RouteToggle id={section} value={value.route} onChange={(route) => onChange({ route })} />
        </div>
        <AnimatePresence initial={false}>
          {value.route === "easier" && (
            <m.p className="overflow-hidden text-xs text-muted-foreground" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING}>
              {t("easierCap")}
            </m.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function RawRow({ id, label, max, value, onChange }: { id: string; label: string; max: number; value: number; onChange: (n: number) => void }) {
  const t = useTranslations("calc");
  const step = (d: number) => onChange(Math.max(0, Math.min(max, value + d)));
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
        </label>
        <span className="text-sm text-muted-foreground tabular-nums">
          <span className="font-display text-base font-extrabold text-foreground">{value}</span> {t("of", { n: max })}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <StepButton label={t("minus")} onClick={() => step(-1)} disabled={value <= 0}>
          <Minus className="size-4" aria-hidden />
        </StepButton>
        <input
          id={id}
          type="range"
          min={0}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(clampRaw(id.startsWith("RW") ? "RW" : "MATH", +e.target.value))}
          className="range flex-1"
          style={{ ["--fill" as string]: `${(value / max) * 100}%` }}
        />
        <StepButton label={t("plus")} onClick={() => step(1)} disabled={value >= max}>
          <Plus className="size-4" aria-hidden />
        </StepButton>
      </div>
    </div>
  );
}

function StepButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-surface shadow-[0_3px_0_var(--border)] transition-transform active:translate-y-[2px] active:shadow-[0_1px_0_var(--border)] disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function RouteToggle({ id, value, onChange }: { id: string; value: Route; onChange: (r: Route) => void }) {
  const t = useTranslations("calc");
  const reduce = useReducedMotion();
  return (
    <LayoutGroup id={`route-${id}`}>
      <div role="radiogroup" aria-label={t("route")} className="flex rounded-xl bg-surface-2 p-1">
        {(["harder", "easier"] as const).map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={value === r}
            onClick={() => onChange(r)}
            className={cn("relative rounded-lg px-3.5 py-1.5 text-sm font-bold transition-colors", value === r ? "text-foreground" : "text-muted-foreground")}
          >
            {value === r && <m.span layoutId={`route-pill-${id}`} className="absolute inset-0 rounded-lg bg-surface shadow-sm" transition={reduce ? { duration: 0 } : SPRING} />}
            <span className="relative">{r === "harder" ? t("harder") : t("easier")}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}

/** Semicircle gauge 400–1600. */
function Gauge({ value }: { value: number }) {
  const pct = (value - 400) / 1200;
  return (
    <svg viewBox="0 0 240 132" className="mx-auto w-full max-w-[280px] overflow-visible" aria-hidden>
      <path d="M20 120 A100 100 0 0 1 220 120" fill="none" stroke="var(--surface-2)" strokeWidth={18} strokeLinecap="round" />
      <m.path d="M20 120 A100 100 0 0 1 220 120" fill="none" stroke="var(--primary)" strokeWidth={18} strokeLinecap="round" initial={false} animate={{ pathLength: Math.max(0.001, pct) }} transition={{ type: "spring", stiffness: 140, damping: 22 }} />
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const a = Math.PI * (1 - f);
        return <circle key={f} cx={120 + 100 * Math.cos(a)} cy={120 - 100 * Math.sin(a)} r={2} fill="var(--surface)" />;
      })}
    </svg>
  );
}

/** Section ring 200–800. */
function Ring({ label, value, tone }: { label: string; value: number; tone: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = (value - 200) / 600;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border p-3">
      <svg viewBox="0 0 64 64" className="size-14 shrink-0 -rotate-90" aria-hidden>
        <circle cx={32} cy={32} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={7} />
        <m.circle cx={32} cy={32} r={r} fill="none" stroke={tone} strokeWidth={7} strokeLinecap="round" strokeDasharray={c} initial={false} animate={{ strokeDashoffset: c * (1 - pct) }} transition={{ type: "spring", stiffness: 140, damping: 22 }} />
      </svg>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <Odometer value={value} className="font-display text-xl font-extrabold" />
      </div>
    </div>
  );
}

/** Draws a share card on a canvas and shares it (or downloads it where sharing files isn't supported). */
function ShareButton({ total, rw, math }: { total: number; rw: number; math: number }) {
  const t = useTranslations("calc");
  async function share() {
    const W = 1080;
    const H = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    await document.fonts.ready;
    const display = getComputedStyle(document.documentElement).getPropertyValue("--font-jakarta").trim() || "sans-serif";
    ctx.fillStyle = "#2563EB";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.arc(W - 120, 140, 300, 0, Math.PI * 2);
    ctx.fill();
    // Gauge
    ctx.lineCap = "round";
    ctx.lineWidth = 44;
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.arc(W / 2, 640, 330, Math.PI, 2 * Math.PI);
    ctx.stroke();
    ctx.strokeStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(W / 2, 640, 330, Math.PI, Math.PI + Math.PI * ((total - 400) / 1200));
    ctx.stroke();
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.font = `600 44px ${display}`;
    ctx.fillText(t("shareTitle"), W / 2, 170);
    ctx.font = `800 220px ${display}`;
    ctx.fillText(String(total), W / 2, 620);
    ctx.font = `700 46px ${display}`;
    ctx.fillText(`${t("rw")} ${rw}   ${t("math")} ${math}`, W / 2, 800);
    ctx.globalAlpha = 0.8;
    ctx.font = `500 34px ${display}`;
    ctx.fillText(t("shareFooter"), W / 2, 980);
    ctx.globalAlpha = 1;
    const owl = new Image();
    owl.src = "/mascot/owl-correct.svg";
    await owl.decode().catch(() => {});
    if (owl.complete && owl.naturalWidth) ctx.drawImage(owl, 70, 60, 180, 150);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
    if (!blob) return;
    const file = new File([blob], `sat-score-${total}.png`, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: t("shareTitle") }).catch(() => {});
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("shared"));
  }
  return (
    <Button type="button" size="lg" variant="outline" onClick={() => void share()}>
      <Share2 aria-hidden />
      <span className="sm:sr-only">{t("share")}</span>
    </Button>
  );
}
