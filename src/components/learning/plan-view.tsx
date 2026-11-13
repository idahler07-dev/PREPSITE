import { getFormatter, getTranslations } from "next-intl/server";
import {
  BookOpen,
  Brain,
  ChevronRight,
  Coffee,
  FileText,
  RotateCcw,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { PlanTask, WeeklyPlan } from "@/lib/coach/plan";
import { cn } from "@/lib/utils";

const ICONS = {
  drill: BookOpen,
  review: RotateCcw,
  mock: FileText,
  vocab: Brain,
  rest: Coffee,
} as const;
/** Icon tile colours, one per kind (gradient top to bottom, white icon). */
const TILE: Record<PlanTask["kind"], string> = {
  drill: "from-[#6f86ff] to-[#2747f5]",
  review: "from-[#ff7a85] to-[#e5484d]",
  mock: "from-[#a897ff] to-[#6b55e8]",
  vocab: "from-[#ffb25e] to-[#f08a1c]",
  rest: "from-[#8fd8b8] to-[#2fae82]",
};
const HREF: Record<PlanTask["kind"], (t: PlanTask) => string | null> = {
  drill: (t) => (t.skill ? `/practice?skill=${t.skill}` : "/practice"),
  review: () => "/review",
  mock: () => "/mocks",
  vocab: () => "/vocab",
  rest: () => null,
};

export async function TaskList({ tasks }: { tasks: PlanTask[] }) {
  const t = await getTranslations("coach");
  const tx = await getTranslations("taxonomy");
  if (!tasks.length)
    return <p className="text-sm text-muted-foreground">{t("nothing")}</p>;
  return (
    <ul className="glass-card divide-y divide-border/60 overflow-hidden rounded-2xl">
      {tasks.map((task, i) => {
        const Icon = ICONS[task.kind];
        const label =
          task.kind === "drill"
            ? t("tasks.drill", {
                count: task.count ?? 10,
                skill: task.skill
                  ? tx(`skills.${task.skill as "INFERENCES"}`)
                  : "",
              })
            : task.kind === "review"
              ? t("tasks.review", { count: task.count ?? 0 })
              : t(`tasks.${task.kind}`);
        const href = HREF[task.kind](task);
        const body = (
          <>
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-b text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.4)]",
                TILE[task.kind],
              )}
            >
              <Icon className="size-[18px]" aria-hidden />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span
                className={cn(
                  "text-[15px] leading-snug font-medium",
                  task.missed &&
                    "text-muted-foreground line-through decoration-1",
                )}
              >
                {label}
              </span>
              {(task.missed || task.carried) && (
                <span
                  className={cn(
                    "text-xs font-semibold",
                    task.missed ? "text-muted-foreground" : "text-primary",
                  )}
                >
                  {task.missed ? t("missed") : t("carried")}
                </span>
              )}
            </span>
            {task.minutes > 0 && (
              <span className="text-sm text-muted-foreground tabular-nums">
                {t("minutes", { count: task.minutes })}
              </span>
            )}
            {href && (
              <ChevronRight
                className="size-4 shrink-0 text-muted-foreground/60"
                aria-hidden
              />
            )}
          </>
        );
        return (
          <li key={i}>
            {href ? (
              <Link
                href={href}
                className="flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-primary-soft/50 active:bg-primary-soft"
              >
                {body}
              </Link>
            ) : (
              <span className="flex min-h-14 items-center gap-3 px-4 py-2.5 text-muted-foreground">
                {body}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export async function WeekView({
  plan,
  today,
}: {
  plan: WeeklyPlan;
  today: string;
}) {
  const format = await getFormatter();
  return (
    <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {plan.days.map((d) => (
        <li
          key={d.date}
          className={cn(
            "space-y-2 rounded-lg border p-3",
            d.date === today && "border-primary bg-primary-soft/40",
          )}
        >
          <h3 className="text-sm font-semibold">
            {format.dateTime(new Date(`${d.date}T12:00:00Z`), {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </h3>
          <TaskList tasks={d.tasks} />
        </li>
      ))}
    </ol>
  );
}

const ART: Record<PlanTask["kind"], string> = {
  drill: "pencil",
  review: "notebook",
  mock: "laptop",
  vocab: "bookmark-tabs",
  rest: "light-bulb",
};

/** Today's tasks, one row each with its illustration. */
export async function TodayCard({ tasks }: { tasks: PlanTask[] }) {
  const t = await getTranslations("coach");
  const tx = await getTranslations("taxonomy");
  const total = tasks.reduce((s, k) => s + (k.missed ? 0 : k.minutes), 0);
  return (
    <section
      aria-labelledby="today-title"
      className="rounded-[24px] border border-border bg-surface p-6 sm:p-8"
    >
      <div className="mb-5 flex items-end justify-between gap-3">
        <div className="space-y-2">
          <p className="text-[12px] font-bold tracking-[0.14em] text-[#A9730E] uppercase">
            {t("todayEyebrow")}
          </p>
          <h2
            id="today-title"
            className="font-display text-[26px] font-extrabold tracking-[-0.03em]"
          >
            {total > 0 ? t("todayTitle", { minutes: total }) : t("todayRest")}
          </h2>
        </div>
      </div>
      {tasks.length === 0 ? (
        <p className="text-muted-foreground">{t("nothing")}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {tasks.map((task, i) => {
            const label =
              task.kind === "drill"
                ? task.skill
                  ? tx(`skills.${task.skill as "INFERENCES"}`)
                  : t("tasks.mock")
                : task.kind === "review"
                  ? t("short.review", { count: task.count ?? 0 })
                  : t(`tasks.${task.kind}`);
            const sub =
              task.kind === "drill"
                ? t("short.drill", { count: task.count ?? 10 })
                : task.minutes > 0
                  ? t("minutes", { count: task.minutes })
                  : null;
            const href = HREF[task.kind](task);
            const body = (
              <>
                <img
                  src={`/illustrations/fluent/${ART[task.kind]}.svg`}
                  alt=""
                  className="size-11 shrink-0 transition-transform group-hover:scale-110"
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate text-[15.5px] font-extrabold tracking-[-0.01em]",
                      task.missed && "text-muted-foreground line-through",
                    )}
                  >
                    {label}
                  </span>
                  <span className="block text-[13px] text-muted-foreground">
                    {task.carried
                      ? t("carried")
                      : task.missed
                        ? t("missed")
                        : sub}
                  </span>
                </span>
                {href && (
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground/60"
                    aria-hidden
                  />
                )}
              </>
            );
            return (
              <li key={i}>
                {href ? (
                  <Link
                    href={href}
                    className="group flex items-center gap-4 rounded-[16px] border border-border bg-surface-2 px-4 py-3.5 transition-colors hover:border-energy/40 hover:bg-energy-soft"
                  >
                    {body}
                  </Link>
                ) : (
                  <span className="flex items-center gap-4 rounded-[16px] border border-border bg-surface-2 px-4 py-3.5">
                    {body}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** The week at a glance: day, date, minutes; missed days marked, today highlighted. */
export async function WeekStrip({
  plan,
  today,
}: {
  plan: WeeklyPlan;
  today: string;
}) {
  const t = await getTranslations("coach");
  const format = await getFormatter();
  return (
    <section aria-labelledby="week-title" className="space-y-5">
      <div className="space-y-2">
        <p className="text-[12px] font-bold tracking-[0.14em] text-[#A9730E] uppercase">
          {t("weekEyebrow")}
        </p>
        <h2
          id="week-title"
          className="font-display text-[26px] font-extrabold tracking-[-0.03em]"
        >
          {t("weekTitle")}
        </h2>
      </div>
      <ol className="grid grid-cols-4 gap-3 sm:grid-cols-7">
        {plan.days.map((d) => {
          const date = new Date(`${d.date}T12:00:00Z`);
          const rest =
            d.tasks.length === 0 || d.tasks.every((k) => k.kind === "rest");
          const mock = d.tasks.some((k) => k.kind === "mock");
          const missed = d.tasks.some((k) => k.missed);
          const mins = d.tasks.reduce(
            (s, k) => s + (k.missed ? 0 : k.minutes),
            0,
          );
          const isToday = d.date === today;
          return (
            <li
              key={d.date}
              className={cn(
                "flex flex-col items-center gap-2 rounded-[18px] border px-2 py-4 text-center",
                isToday
                  ? "border-energy bg-energy-soft"
                  : "border-border bg-surface",
                d.date < today && "opacity-80",
              )}
            >
              <span className="text-[12px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
                {format.dateTime(date, { weekday: "short" })}
              </span>
              <span className="font-display text-[24px] leading-none font-extrabold tracking-[-0.03em]">
                {format.dateTime(date, { day: "numeric" })}
              </span>
              <img
                src={`/illustrations/fluent/${rest ? "light-bulb" : mock ? "laptop" : "pencil"}.svg`}
                alt=""
                className={cn("size-7", rest && "opacity-40 grayscale")}
              />
              <span
                className={cn(
                  "text-[12px] font-semibold",
                  missed
                    ? "text-muted-foreground line-through"
                    : "text-foreground",
                )}
              >
                {rest
                  ? t("restShort")
                  : missed
                    ? t("missed")
                    : t("minutes", { count: mins })}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
