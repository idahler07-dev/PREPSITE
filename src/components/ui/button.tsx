import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

/**
 * Buttons: primary (cobalt), secondary (outline), ghost, accent (coral:
 * upgrade/pricing CTAs only), destructive and link. Hover lifts 2px, press
 * scales to 0.97 and springs back (CSS spring easing; see lib/motion.ts).
 */
const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-input)] text-sm font-semibold whitespace-nowrap outline-none select-none transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.34,1.4,0.64,1)] focus-visible:ring-[3px] focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.97]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow-md",
        secondary: "border border-border bg-surface text-foreground shadow-sm hover:border-primary/50 hover:shadow-md",
        outline: "border border-border bg-surface text-foreground shadow-sm hover:border-primary/50 hover:shadow-md",
        ghost: "text-foreground hover:bg-surface-2 motion-safe:hover:translate-y-0",
        accent: "bg-accent text-accent-foreground shadow-sm hover:shadow-md hover:brightness-105",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:brightness-110 focus-visible:ring-destructive/40",
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline motion-safe:hover:translate-y-0 motion-safe:active:scale-100",
      },
      size: {
        default: "h-10 px-4 has-[>svg]:px-3.5",
        xs: "h-7 gap-1 px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 px-6 text-base has-[>svg]:px-5",
        icon: "size-10",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
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
