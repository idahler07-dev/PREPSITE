import * as React from "react"
import { cn } from "@/lib/utils"

/** Cards: 12px radius, soft shadow in light mode, border only in dark mode. `interactive` lifts on hover. */
function Card({ className, interactive = false, ...props }: React.ComponentProps<"div"> & { interactive?: boolean }) {
  return (
    <div
      data-slot="card"
      data-interactive={interactive || undefined}
      className={cn(
        interactive &&
          "transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-primary/40 hover:shadow-lg motion-safe:hover:-translate-y-1",
        "flex flex-col gap-5 rounded-lg border bg-card py-5 text-card-foreground shadow-sm lg:gap-6 lg:py-8",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-5 lg:px-8 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

/** A real heading (h2 by default) so screen-reader users can jump between cards. */
function CardTitle({ className, as: Tag = "h2", ...props }: React.ComponentProps<"h2"> & { as?: "h2" | "h3" | "h4" | "div" }) {
  return (
    <Tag
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-5 lg:px-8", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-5 lg:px-8 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
