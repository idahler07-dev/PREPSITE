import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

/** Seven small flames, one per recent day: lit when you studied. */
export function StreakFlames({
  days,
}: {
  days: {
    key: string;
    label: string;
    lit: boolean;
    litLabel: string;
    dimLabel: string;
  }[];
}) {
  return (
    <ul className="flex gap-1.5">
      {days.map((d) => (
        <li key={d.key} className="text-center">
          <Flame
            className={cn(
              "mx-auto size-7",
              d.lit
                ? "fill-energy text-energy"
                : "fill-transparent text-border",
            )}
            strokeWidth={d.lit ? 1.5 : 2}
            aria-hidden
          />
          <span className="sr-only">{d.lit ? d.litLabel : d.dimLabel}</span>
          <span
            aria-hidden
            className="mt-0.5 block text-[11px] font-medium text-muted-foreground"
          >
            {d.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
