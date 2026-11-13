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
