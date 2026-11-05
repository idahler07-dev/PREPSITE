import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

/**
 * Buttons. Primary is chunky: a darker 4px bottom edge, and the face presses
 * down 2px onto it. Secondary/outline are a quiet bordered surface. Accent
 * (amber) is for streak/XP moments only.
 */
const press =
  "motion-safe:active:translate-y-[2px] transition-[transform,background-color,border-color,color,box-shadow,filter] duration-150 ease-out"

const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-display text-sm font-bold whitespace-nowrap outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: `${press} bg-primary text-primary-foreground shadow-[0_4px_0_var(--primary-edge)] hover:brightness-[1.06] active:shadow-[0_2px_0_var(--primary-edge)]`,
        secondary: `${press} border border-border bg-surface text-foreground shadow-[0_3px_0_var(--border)] hover:bg-surface-2 active:shadow-[0_1px_0_var(--border)]`,
        outline: `${press} border border-border bg-surface text-foreground shadow-[0_3px_0_var(--border)] hover:bg-surface-2 active:shadow-[0_1px_0_var(--border)]`,
        ghost: "transition-colors text-foreground hover:bg-surface-2",
        accent: `${press} bg-accent text-accent-foreground shadow-[0_4px_0_color-mix(in_oklab,var(--accent),black_22%)] hover:brightness-105 active:shadow-[0_2px_0_color-mix(in_oklab,var(--accent),black_22%)]`,
        destructive: `${press} bg-destructive text-destructive-foreground shadow-[0_4px_0_color-mix(in_oklab,var(--destructive),black_25%)] hover:brightness-110 active:shadow-[0_2px_0_color-mix(in_oklab,var(--destructive),black_25%)] focus-visible:ring-destructive/40`,
        link: "h-auto px-0 font-sans font-semibold text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 has-[>svg]:px-4",
        xs: "h-7 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-md px-3.5 has-[>svg]:px-3",
        lg: "h-13 px-7 text-base has-[>svg]:px-6",
        icon: "size-11",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-md",
        "icon-lg": "size-13",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
