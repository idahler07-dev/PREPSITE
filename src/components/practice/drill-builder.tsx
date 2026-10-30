"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Play, Zap } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { DOMAINS, type SectionKey } from "@/lib/taxonomy";
import { MAX_DRILL_QUESTIONS } from "@/lib/practice/drill";
import { secondsPerQuestion } from "@/config/test-structure";
import { countMatchingQuestions, startDrill } from "@/server/actions/practice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { openTest } from "@/lib/open-test";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

export function DrillBuilder({ initial }: { initial?: { section?: SectionKey; domains?: string[]; skills?: string[] } }) {
  const t = useTranslations("practice");
  const tb = useTranslations("billing");
  const tx = useTranslations("taxonomy");
  const te = useTranslations("enums");
  const c = useTranslations("common");
  const router = useRouter();
  const [pending, start] = useTransition();

  const [section, setSection] = useState<SectionKey | null>(initial?.section ?? null);
  const [domains, setDomains] = useState<string[]>(initial?.domains ?? []);
  const [skills, setSkills] = useState<string[]>(initial?.skills ?? []);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [count, setCount] = useState(10);
  const [codeFrom, setCodeFrom] = useState("");
  const [codeTo, setCodeTo] = useState("");
  const [timed, setTimed] = useState(false);
  const [feedback, setFeedback] = useState<"IMMEDIATE" | "END">("IMMEDIATE");
  const [unseenFirst, setUnseenFirst] = useState(true);
  const [matching, setMatching] = useState<number | null>(null);

  const config = useMemo(
    () => ({ section, domains, skills, difficulties, count, codeFrom, codeTo, timed, feedback, unseenFirst }),
    [section, domains, skills, difficulties, count, codeFrom, codeTo, timed, feedback, unseenFirst],
  );

  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(async () => {
      const n = await countMatchingQuestions({ ...config, count: 1 });
      if (!cancelled) setMatching(n);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [config]);

  const visibleDomains = DOMAINS.filter((d) => !section || d.section === section);
  const visibleSkills = (domains.length ? DOMAINS.filter((d) => domains.includes(d.key)) : visibleDomains).flatMap((d) => [...d.skills]);
  const toggle = <T,>(list: T[], v: T, set: (x: T[]) => void) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  function launch(cfg: Record<string, unknown>) {
    start(async () => {
      const res = await startDrill(cfg);
      if (res.ok) openTest(res.id);
      else if (res.error === "DAILY_LIMIT")
        toast.error(tb("limits.daily", { left: Number(res.message) || 0 }), { action: { label: tb("limits.upgrade"), onClick: () => router.push("/pricing") } });
      else toast.error(res.error === "NO_QUESTIONS" ? t("noQuestions") : c("unknownError"));
    });
  }

  const quick = [
    { label: t("quickMixed"), cfg: { count: 10 } },
    { label: t("quickMath"), cfg: { section: "MATH", count: 10 } },
    { label: t("quickRw"), cfg: { section: "RW", count: 10 } },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="size-4 text-primary" aria-hidden /> {t("quickStart")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {quick.map((q) => (
            <Button key={q.label} variant="secondary" disabled={pending} onClick={() => launch({ ...q.cfg, feedback: "IMMEDIATE", unseenFirst: true })}>
              {q.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6 pt-6">
          <fieldset>
            <legend className="mb-2 text-sm font-medium">{t("section")}</legend>
            <div className="flex flex-wrap gap-2">
              {([null, "RW", "MATH"] as const).map((s) => (
                <Chip
                  key={s ?? "both"}
                  active={section === s}
                  onClick={() => {
                    setSection(s);
                    setDomains([]);
                    setSkills([]);
                  }}
                >
                  {s ? tx(`sections.${s}`) : t("bothSections")}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">{t("domains")}</legend>
            <div className="flex flex-wrap gap-2">
              {visibleDomains.map((d) => (
                <Chip
                  key={d.key}
                  active={domains.includes(d.key)}
                  onClick={() => {
                    toggle(domains, d.key, setDomains);
                    setSkills((s) => s.filter((sk) => !(d.skills as readonly string[]).includes(sk)));
                  }}
                >
                  {tx(`domains.${d.key}`)}
                </Chip>
              ))}
            </div>
          </fieldset>

          <details className="group" open={!!initial?.skills?.length}>
            <summary className="cursor-pointer text-sm font-medium">
              {t("skills")}
              <span className="ms-2 text-muted-foreground">{skills.length ? c("selected", { count: skills.length }) : t("allSkills")}</span>
            </summary>
            <div className="mt-2 flex flex-wrap gap-2">
              {visibleSkills.map((s) => (
                <Chip key={s} active={skills.includes(s)} onClick={() => toggle(skills, s, setSkills)} small>
                  {tx(`skills.${s as "INFERENCES"}`)}
                </Chip>
              ))}
            </div>
          </details>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">{t("difficulty")}</legend>
            <div className="flex flex-wrap gap-2">
              {(["EASY", "MEDIUM", "HARD"] as const).map((d) => (
                <Chip key={d} active={difficulties.includes(d)} onClick={() => toggle(difficulties, d, setDifficulties)}>
                  {te(`difficulty.${d}`)}
                </Chip>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="count">{t("count")}</Label>
              <div className="flex items-center gap-3">
                <input
                  id="count"
                  type="range"
                  min={1}
                  max={MAX_DRILL_QUESTIONS}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full accent-[var(--primary)]"
                />
                <span className="w-8 text-end font-semibold tabular-nums">{count}</span>
              </div>
            </div>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">{t("timing")}</legend>
              <div className="flex flex-wrap gap-2">
                <Chip active={!timed} onClick={() => setTimed(false)}>
                  {t("untimed")}
                </Chip>
                <Chip active={timed} onClick={() => setTimed(true)}>
                  {t("timed")}
                </Chip>
              </div>
              {timed && <p className="mt-1 text-sm text-muted-foreground">{t("timedHelp", { seconds: secondsPerQuestion(section ?? "MIXED") })}</p>}
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">{t("feedback")}</legend>
              <div className="flex flex-wrap gap-2">
                <Chip active={feedback === "IMMEDIATE"} onClick={() => setFeedback("IMMEDIATE")}>
                  {t("feedbackImmediate")}
                </Chip>
                <Chip active={feedback === "END"} onClick={() => setFeedback("END")}>
                  {t("feedbackEnd")}
                </Chip>
              </div>
            </fieldset>
            <label className="flex items-center gap-2 self-end text-sm">
              <input type="checkbox" checked={unseenFirst} onChange={(e) => setUnseenFirst(e.target.checked)} className="size-4" />
              {t("unseenFirst")}
            </label>
          </div>

          <details>
            <summary className="cursor-pointer text-sm font-medium">{t("codeRange")}</summary>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="codeFrom">{t("codeFrom")}</Label>
                <Input id="codeFrom" value={codeFrom} onChange={(e) => setCodeFrom(e.target.value.toUpperCase())} className="font-mono" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="codeTo">{t("codeTo")}</Label>
                <Input id="codeTo" value={codeTo} onChange={(e) => setCodeTo(e.target.value.toUpperCase())} className="font-mono" />
              </div>
              <p className="text-sm text-muted-foreground sm:col-span-2">{t("codeRangeHelp")}</p>
            </div>
          </details>

          <div className="flex flex-wrap items-center gap-4 border-t pt-4">
            <Button size="lg" disabled={pending || matching === 0} onClick={() => launch(config)}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Play aria-hidden />}
              {pending ? t("starting") : t("start")}
            </Button>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {matching === null ? c("loading") : matching === 0 ? t("noQuestions") : t("matching", { count: matching })}
              {matching !== null && matching > 0 && matching < count && ` ${t("lessThanRequested", { count: matching })}`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Chip({ active, onClick, children, small }: { active: boolean; onClick: () => void; children: React.ReactNode; small?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        small && "px-2.5 py-1 text-xs",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-surface-2 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
