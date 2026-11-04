"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

/*
 * Liquid glass and metal buttons (from 21st.dev community components),
 * adapted: one filter per button (useId), radix-ui Slot, our tokens.
 * The glass ripple uses an SVG backdrop filter that Chromium supports; other
 * browsers show the same button with the bevelled edge only.
 */

const liquidButtonVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-semibold whitespace-nowrap outline-none transition-[color,box-shadow,transform] duration-300 disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-transparent text-foreground motion-safe:hover:scale-105",
        primary: "bg-transparent text-primary motion-safe:hover:scale-105",
      },
      size: {
        default: "h-10 px-5",
        lg: "h-12 px-7",
        xl: "h-14 px-9 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "lg" },
  },
);

export function LiquidButton({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof liquidButtonVariants> & { asChild?: boolean }) {
  const id = React.useId().replace(/:/g, "");
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp data-slot="button" className={cn(liquidButtonVariants({ variant, size }), className)} {...props}>
      <Slot.Slottable>
        <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      </Slot.Slottable>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 rounded-full shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(0,0,0,0.9),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.85),inset_1px_1px_1px_-0.5px_rgba(0,0,0,0.6),inset_-1px_-1px_1px_-0.5px_rgba(0,0,0,0.6),inset_0_0_6px_6px_rgba(0,0,0,0.12),inset_0_0_2px_2px_rgba(0,0,0,0.06),0_0_12px_rgba(255,255,255,0.15)] transition-all dark:shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.09),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.6),inset_0_0_6px_6px_rgba(255,255,255,0.12),inset_0_0_2px_2px_rgba(255,255,255,0.06),0_0_12px_rgba(0,0,0,0.15)]"
      />
      <span aria-hidden className="pointer-events-none absolute inset-0 isolate -z-10 overflow-hidden rounded-full" style={{ backdropFilter: `url("#${id}")` }} />
      <svg aria-hidden className="absolute size-0">
        <defs>
          <filter id={id} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves={1} seed={1} result="turbulence" />
            <feGaussianBlur in="turbulence" stdDeviation={2} result="blurredNoise" />
            <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale={70} xChannelSelector="R" yChannelSelector="B" result="displaced" />
            <feGaussianBlur in="displaced" stdDeviation={4} result="finalBlur" />
            <feComposite in="finalBlur" in2="finalBlur" operator="over" />
          </filter>
        </defs>
      </svg>
    </Comp>
  );
}

type MetalVariant = "default" | "primary" | "gold";

const METAL: Record<MetalVariant, { outer: string; inner: string; button: string; text: string }> = {
  default: {
    outer: "bg-gradient-to-b from-[#000] to-[#a0a0a0]",
    inner: "bg-gradient-to-b from-[#fafafa] via-[#3e3e3e] to-[#e5e5e5]",
    button: "bg-gradient-to-b from-[#b9b9b9] to-[#969696]",
    text: "text-white [text-shadow:_0_-1px_0_rgb(80_80_80_/_100%)]",
  },
  primary: {
    outer: "bg-gradient-to-b from-[#0b1f3b] to-[#9fb0ff]",
    inner: "bg-gradient-to-b from-[#e8eeff] via-[#1c32c4] to-[#dfe6ff]",
    button: "bg-gradient-to-b from-[#6f86ff] to-[#2747f5]",
    text: "text-white [text-shadow:_0_-1px_0_rgb(20_36_130_/_100%)]",
  },
  gold: {
    outer: "bg-gradient-to-b from-[#917100] to-[#ead98f]",
    inner: "bg-gradient-to-b from-[#fffddd] via-[#856807] to-[#fff1b3]",
    button: "bg-gradient-to-b from-[#ffeba1] to-[#9b873f]",
    text: "text-[#3a2c00] [text-shadow:_0_1px_0_rgb(255_250_220_/_70%)]",
  },
};

/** A bevelled metal button that presses in (from 21st.dev community components). Use sparingly: one per section at most. */
export const MetalButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: MetalVariant; asChild?: boolean }>(
  ({ children, className, variant = "primary", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : "button";
    const [pressed, setPressed] = React.useState(false);
    const c = METAL[variant];
    const t = "all 250ms cubic-bezier(0.1, 0.4, 0.2, 1)";
    return (
      <span
        className={cn("relative inline-flex transform-gpu rounded-[14px] p-[1.25px]", c.outer)}
        style={{ transform: pressed ? "translateY(2.5px) scale(0.99)" : "none", boxShadow: pressed ? "0 1px 2px rgba(0,0,0,.15)" : "0 3px 8px rgba(0,0,0,.08)", transition: t }}
      >
        <span aria-hidden className={cn("absolute inset-px rounded-[13px]", c.inner)} />
        <Comp
          ref={ref}
          className={cn("relative z-10 m-px inline-flex h-11 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-[12px] px-6 text-sm leading-none font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50", c.button, c.text, className)}
          style={{ transform: pressed ? "scale(0.97)" : "none", transition: t }}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
          onPointerCancel={() => setPressed(false)}
          {...props}
        >
          {children}
        </Comp>
      </span>
    );
  },
);
MetalButton.displayName = "MetalButton";
