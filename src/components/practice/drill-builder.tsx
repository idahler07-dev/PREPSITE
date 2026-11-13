"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronRight, Loader2, Play } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { DOMAINS, type SectionKey } from "@/lib/taxonomy";
import { MAX_DRILL_QUESTIONS } from "@/lib/practice/drill";
import { countMatchingQuestions, startDrill } from "@/server/actions/practice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { openTest } from "@/lib/open-test";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

export function DrillBuilder({
  initial,
  weakSkills = [],
}: {
  initial?: { section?: SectionKey; domains?: string[]; skills?: string[] };
  /** The student's weakest skills, weakest first: offered as a one-click mix. */
  weakSkills?: string[];
}) {
  const t = useTranslations("practice");
  const tb = useTranslations("billing");
  const tx = useTranslations("taxonomy");
  const te = useTranslations("enums");
  const c = useTranslations("common");
  const router = useRouter();
  const [pending, start] = useTransition();

  const [section, setSection] = useState<SectionKey | null>(
    initial?.section ?? null,
  );
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
    () => ({
      section,
      domains,
      skills,
      difficulties,
      count,
      codeFrom,
      codeTo,
      timed,
      feedback,
      unseenFirst,
    }),
    [
      section,
      domains,
      skills,
      difficulties,
      count,
      codeFrom,
      codeTo,
      timed,
      feedback,
      unseenFirst,
    ],
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

  const visibleDomains = DOMAINS.filter(
    (d) => !section || d.section === section,
  );
  const visibleSkills = (
    domains.length
      ? DOMAINS.filter((d) => domains.includes(d.key))
      : visibleDomains
  ).flatMap((d) => [...d.skills]);
  const toggle = <T,>(list: T[], v: T, set: (x: T[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  function launch(cfg: Record<string, unknown>) {
    start(async () => {
      const res = await startDrill(cfg);
      if (res.ok) openTest(res.id);
      else if (res.error === "DAILY_LIMIT")
        toast.error(tb("limits.daily", { left: Number(res.message) || 0 }), {
          action: {
            label: tb("limits.upgrade"),
            onClick: () => router.push("/pricing"),
          },
        });
      else
        toast.error(
          res.error === "NO_QUESTIONS" ? t("noQuestions") : c("unknownError"),
        );
    });
  }

  const quick: {
    label: string;
    hint?: string;
    cfg: Record<string, unknown>;
    art: string;
  }[] = [
    ...(weakSkills.length
      ? [
          {
            art: "brain",
            label: t("quickWeak"),
            hint: t("quickWeakHint", {
              skills: weakSkills
                .slice(0, 2)
                .map((s) => tx(`skills.${s as "INFERENCES"}`))
                .join(", "),
            }),
            cfg: { skills: weakSkills, count: 10 },
          },
        ]
      : []),
    { art: "books", label: t("quickMixed"), cfg: { count: 10 } },
    {
      art: "compass",
      label: t("quickMath"),
      cfg: { section: "MATH", count: 10 },
    },
    {
      art: "open-book",
      label: t("quickRw"),
      cfg: { section: "RW", count: 10 },
    },
  ];

  return (
    <div className="space-y-8">
      <section aria-labelledby="quick-start">
        <h2
          id="quick-start"
          className="mb-4 text-[12px] font-bold tracking-[0.14em] text-[#A9730E] uppercase"
        >
          {t("quickStart")}
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {quick.map((q) => (
            <button
              key={q.label}
              type="button"
              disabled={pending}
              onClick={() =>
                launch({ ...q.cfg, feedback: "IMMEDIATE", unseenFirst: true })
              }
              className={cn(
                "group flex flex-col items-start gap-4 rounded-[20px] border p-5 text-start transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--elev-md)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60",
                q.hint
                  ? "border-energy/30 bg-energy-soft"
                  : "border-border bg-surface",
              )}
            >
              <img
                src={`/illustrations/fluent/${q.art}.svg`}
                alt=""
                className="size-12 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3"
              />
              <span className="min-w-0">
                <span className="block text-[16px] leading-snug font-extrabold tracking-[-0.01em]">
                  {q.label}
                </span>
                {q.hint && (
                  <span className="mt-1 line-clamp-2 block text-[13px] text-muted-foreground">
                    {q.hint}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </section>

      <details className="group/b rounded-[20px] border border-border bg-surface">
        <summary className="flex cursor-pointer list-none items-center gap-4 p-5 [&::-webkit-details-marker]:hidden">
          <img
            src="/illustrations/fluent/card-index-dividers.svg"
            alt=""
            className="size-10"
          />
          <span className="flex-1">
            <span className="block text-[16px] font-extrabold tracking-[-0.01em]">
              {t("buildTitle")}
            </span>
            <span className="block text-[13px] text-muted-foreground">
              {t("buildHint")}
            </span>
          </span>
          <ChevronRight
            className="size-5 text-muted-foreground transition-transform group-open/b:rotate-90"
            aria-hidden
          />
        </summary>
        <div className="border-t border-border">
          <Card className="border-0 shadow-none">
            <CardContent className="space-y-6 pt-6">
              <fieldset>
                <legend className="mb-2 text-sm font-medium">
                  {t("section")}
                </legend>
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
                <legend className="mb-2 text-sm font-medium">
                  {t("domains")}
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {visibleDomains.map((d) => (
                    <Chip
                      key={d.key}
                      active={domains.includes(d.key)}
                      onClick={() => {
                        toggle(domains, d.key, setDomains);
                        setSkills((s) =>
                          s.filter(
                            (sk) =>
                              !(d.skills as readonly string[]).includes(sk),
                          ),
                        );
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
                  <span className="ms-2 text-muted-foreground">
                    {skills.length
                      ? c("selected", { count: skills.length })
                      : t("allSkills")}
                  </span>
                </summary>
                <div className="mt-2 flex flex-wrap gap-2">
                  {visibleSkills.map((s) => (
                    <Chip
                      key={s}
                      active={skills.includes(s)}
                      onClick={() => toggle(skills, s, setSkills)}
                      small
                    >
                      {tx(`skills.${s as "INFERENCES"}`)}
                    </Chip>
                  ))}
                </div>
              </details>

              <fieldset>
                <legend className="mb-2 text-sm font-medium">
                  {t("difficulty")}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {(["EASY", "MEDIUM", "HARD"] as const).map((d) => (
                    <Chip
                      key={d}
                      active={difficulties.includes(d)}
                      onClick={() => toggle(difficulties, d, setDifficulties)}
                    >
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
                    <span className="w-8 text-end font-semibold tabular-nums">
                      {count}
                    </span>
                  </div>
                </div>
                <fieldset>
                  <legend className="mb-2 text-sm font-medium">
                    {t("timing")}
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    <Chip active={!timed} onClick={() => setTimed(false)}>
                      {t("untimed")}
                    </Chip>
                    <Chip active={timed} onClick={() => setTimed(true)}>
                      {t("timed")}
                    </Chip>
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="mb-2 text-sm font-medium">
                    {t("feedback")}
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    <Chip
                      active={feedback === "IMMEDIATE"}
                      onClick={() => setFeedback("IMMEDIATE")}
                    >
                      {t("feedbackImmediate")}
                    </Chip>
                    <Chip
                      active={feedback === "END"}
                      onClick={() => setFeedback("END")}
                    >
                      {t("feedbackEnd")}
                    </Chip>
                  </div>
                </fieldset>
                <label className="flex items-center gap-2 self-end text-sm">
                  <input
                    type="checkbox"
                    checked={unseenFirst}
                    onChange={(e) => setUnseenFirst(e.target.checked)}
                    className="size-4"
                  />
                  {t("unseenFirst")}
                </label>
              </div>

              <details>
                <summary className="cursor-pointer text-sm font-medium">
                  {t("codeRange")}
                </summary>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="codeFrom">{t("codeFrom")}</Label>
                    <Input
                      id="codeFrom"
                      value={codeFrom}
                      onChange={(e) =>
                        setCodeFrom(e.target.value.toUpperCase())
                      }
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="codeTo">{t("codeTo")}</Label>
                    <Input
                      id="codeTo"
                      value={codeTo}
                      onChange={(e) => setCodeTo(e.target.value.toUpperCase())}
                      className="font-mono"
                    />
                  </div>
                </div>
              </details>

              <div className="flex flex-wrap items-center gap-4 border-t pt-4">
                <Button
                  size="lg"
                  disabled={pending || matching === 0}
                  onClick={() => launch(config)}
                >
                  {pending ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : (
                    <Play aria-hidden />
                  )}
                  {pending ? t("starting") : t("start")}
                </Button>
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  {matching === null
                    ? c("loading")
                    : matching === 0
                      ? t("noQuestions")
                      : t("matching", { count: matching })}
                  {matching !== null &&
                    matching > 0 &&
                    matching < count &&
                    ` ${t("lessThanRequested", { count: matching })}`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </details>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  small,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-2 text-start text-sm transition-colors",
        small && "px-2.5 py-1.5 text-xs",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-transparent bg-surface-2 hover:border-border hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
