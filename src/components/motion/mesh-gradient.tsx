"use client";

import { useEffect, useRef } from "react";
import { m, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useLiteMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Marketing only (hero and final CTA): a soft mesh of cobalt, lilac and coral
 * at low opacity. It drifts slowly (20s loop) and leans gently toward the
 * cursor. Static on small/weak devices and with reduced motion.
 */
export function MeshGradient({ className, interactive = true }: { className?: string; interactive?: boolean }) {
  const lite = useLiteMotion();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 20 });
  const sy = useSpring(my, { stiffness: 40, damping: 20 });
  const x = useTransform(sx, (v) => v * 40);
  const y = useTransform(sy, (v) => v * 30);

  useEffect(() => {
    if (lite || !interactive) return;
    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [lite, interactive, mx, my]);

  const blob = "absolute rounded-full blur-3xl";
  const drift = !reduce && !lite;
  return (
    <div ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden [opacity:var(--mesh-opacity)]", className)}>
      <m.div className="absolute inset-0" style={{ x, y }}>
        <m.div
          className={cn(blob, "top-[-20%] right-[-10%] size-[60vmax] max-h-[720px] max-w-[720px] bg-primary/50")}
          animate={drift ? { x: [0, -40, 20, 0], y: [0, 30, -20, 0] } : undefined}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <m.div
          className={cn(blob, "bottom-[-25%] left-[20%] size-[50vmax] max-h-[620px] max-w-[620px] bg-highlight/60")}
          animate={drift ? { x: [0, 50, -30, 0], y: [0, -20, 20, 0] } : undefined}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: -6 }}
        />
        <m.div
          className={cn(blob, "right-[-5%] bottom-[-10%] size-[38vmax] max-h-[480px] max-w-[480px] bg-accent/40")}
          animate={drift ? { x: [0, -30, 30, 0], y: [0, 20, -30, 0] } : undefined}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: -12 }}
        />
      </m.div>
    </div>
  );
}
