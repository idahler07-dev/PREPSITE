import { cn } from "@/lib/utils"

/** Placeholder with a soft shimmer (a plain tint with reduced motion). */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("skeleton-shimmer rounded-[var(--radius-input)] bg-surface-2", className)}
      {...props}
    />
  )
}

export { Skeleton }
