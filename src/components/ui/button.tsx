import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

/**
 * Buttons (masterplan §6). Pills that press in slightly.
 *  - default: the orange action, one per view, with a soft glow.
 *  - dark: navy, for neutral confirmations next to an orange action.
 *  - secondary / outline: white with a warm hairline.
 *  - teal: data and tutor actions.
 */
const press = "motion-safe:active:scale-[0.97] transition-[transform,background-color,border-color,color,box-shadow,filter] duration-150 ease-out"

const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-display text-sm font-bold whitespace-nowrap outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: `${press} bg-(image:--grad-cta) text-primary-foreground shadow-[var(--glow-energy)] hover:brightness-[1.07]`,
        dark: `${press} bg-foreground text-background hover:brightness-125`,
        teal: `${press} bg-primary text-primary-foreground hover:brightness-110`,
        secondary: `${press} border border-border bg-surface text-foreground shadow-[var(--elev-sm)] hover:bg-surface-2`,
        outline: `${press} border border-border bg-surface text-foreground hover:bg-surface-2`,
        ghost: "transition-colors text-foreground hover:bg-surface-2",
        accent: `${press} bg-(image:--grad-cta) text-primary-foreground shadow-[var(--glow-energy)] hover:brightness-[1.07]`,
        destructive: `${press} bg-destructive text-destructive-foreground hover:brightness-110 focus-visible:outline-destructive`,
        link: "h-auto rounded-md px-0 font-sans font-semibold text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 has-[>svg]:px-4",
        xs: "h-7 gap-1 px-2.5 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-13 px-7 text-base has-[>svg]:px-6",
        icon: "size-11",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
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
