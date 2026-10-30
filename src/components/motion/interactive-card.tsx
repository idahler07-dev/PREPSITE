"use client";

import { useRef, type ComponentProps, type PointerEvent } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { spring, useLiteMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Bento card with a faint radial spotlight under the cursor (desktop), and
 * optional 3D tilt (max 4°, landing feature cards only). Both are off on
 * touch/small/weak devices and with reduced motion.
 */
export function SpotlightCard({ className, tilt = false, children, ...props }: ComponentProps<"div"> & { tilt?: boolean }) {
  const lite = useLiteMotion();
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, spring.soft);
  const sry = useSpring(ry, spring.soft);

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (lite || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ref.current.style.setProperty("--spot-x", `${px * 100}%`);
    ref.current.style.setProperty("--spot-y", `${py * 100}%`);
    ref.current.style.setProperty("--spot-o", "1");
    if (tilt) {
      ry.set((px - 0.5) * 8);
      rx.set((0.5 - py) * 8);
    }
  }
  function onLeave() {
    ref.current?.style.setProperty("--spot-o", "0");
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={tilt && !lite ? { rotateX: srx, rotateY: sry, transformPerspective: 900 } : undefined}
      className={cn(
        "spotlight rounded-lg border bg-surface shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-primary/30 hover:shadow-lg",
        className,
      )}
      {...(props as ComponentProps<typeof motion.div>)}
    >
      {children}
    </motion.div>
  );
}

/** Hero CTAs only: the button follows the cursor slightly (max 8px) and springs back. */
export function Magnetic({ children, className }: { children: React.ReactNode; className?: string }) {
  const lite = useLiteMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, spring.snappy);
  const sy = useSpring(y, spring.snappy);
  return (
    <motion.div
      className={cn("inline-flex", className)}
      style={lite ? undefined : { x: sx, y: sy }}
      onPointerMove={(e) => {
        if (lite) return;
        const r = e.currentTarget.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        x.set(Math.max(-8, Math.min(8, dx * 0.25)));
        y.set(Math.max(-8, Math.min(8, dy * 0.35)));
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
