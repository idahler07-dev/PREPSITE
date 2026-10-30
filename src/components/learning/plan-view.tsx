import { getFormatter, getTranslations } from "next-intl/server";
import { BookOpen, Brain, Coffee, FileText, RotateCcw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { PlanTask, WeeklyPlan } from "@/lib/coach/plan";
import { cn } from "@/lib/utils";

const ICONS = { drill: BookOpen, review: RotateCcw, mock: FileText, vocab: Brain, rest: Coffee } as const;
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
  if (!tasks.length) return <p className="text-sm text-muted-foreground">{t("nothing")}</p>;
  return (
    <ul className="space-y-2">
      {tasks.map((task, i) => {
        const Icon = ICONS[task.kind];
        const label =
          task.kind === "drill"
            ? t("tasks.drill", { count: task.count ?? 10, skill: task.skill ? tx(`skills.${task.skill as "INFERENCES"}`) : "" })
            : task.kind === "review"
              ? t("tasks.review", { count: task.count ?? 0 })
              : t(`tasks.${task.kind}`);
        const href = HREF[task.kind](task);
        const body = (
          <>
            <Icon className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="flex-1">{label}</span>
            {task.minutes > 0 && <span className="text-xs text-muted-foreground tabular-nums">{t("minutes", { count: task.minutes })}</span>}
          </>
        );
        return (
          <li key={i}>
            {href ? (
              <Link href={href} className="flex items-center gap-2 rounded-md border p-2 text-sm hover:bg-muted">
                {body}
              </Link>
            ) : (
              <span className="flex items-center gap-2 rounded-md border border-dashed p-2 text-sm text-muted-foreground">{body}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export async function WeekView({ plan, today }: { plan: WeeklyPlan; today: string }) {
  const format = await getFormatter();
  return (
    <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {plan.days.map((d) => (
        <li key={d.date} className={cn("space-y-2 rounded-lg border p-3", d.date === today && "border-primary bg-accent/40")}>
          <h3 className="text-sm font-semibold">{format.dateTime(new Date(`${d.date}T12:00:00Z`), { weekday: "long", day: "numeric", month: "short" })}</h3>
          <TaskList tasks={d.tasks} />
        </li>
      ))}
    </ol>
  );
}
