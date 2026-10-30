import type { ReactNode } from "react";
import { Mascot, type MascotPose } from "@/components/mascot/mascot";
import { cn } from "@/lib/utils";

/** Never a blank screen: an Otto pose, one sentence and one action. */
export function EmptyState({ pose = "think", title, body, action, className }: { pose?: MascotPose; title?: ReactNode; body: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[20px] border border-dashed bg-surface px-6 py-12 text-center", className)}>
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
        <Mascot pose={pose} className="w-28" />
        {title && <h2 className="text-h3 font-semibold">{title}</h2>}
        <p className="text-muted-foreground">{body}</p>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
