"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { m, useAnimationControls, useReducedMotion, type Transition } from "motion/react";
import { cn } from "@/lib/utils";

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Liquid: a little overshoot so the drop settles with a wobble. */
const LIQUID: Transition = { type: "spring", stiffness: 340, damping: 24, mass: 0.9 };
/** Reduced motion: quick and flat, no overshoot. */
const CALM: Transition = { type: "spring", stiffness: 900, damping: 80, mass: 1 };

/**
 * A highlight that glides between items like a drop of liquid. When it moves
 * it squishes in the direction of travel and leans into the motion, and for
 * the length of the glide an SVG filter merges its edges, so it reads as one
 * blob rather than a box sliding. At rest it's crisp. Items mark themselves
 * with `data-liquid-key`, and the highlight follows `activeKey`. Reduced
 * motion: it snaps, with no squish, lean or filter.
 */
export function LiquidGroup({
  activeKey,
  as = "div",
  indicatorClassName,
  className,
  children,
  ...rest
}: {
  activeKey: string | null | undefined;
  as?: "div" | "ul" | "nav";
  /** Look of the highlight: colour, radius, border, shadow. */
  indicatorClassName?: string;
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "children" | "className">) {
  const Root = as as "div";
  const ref = useRef<HTMLDivElement>(null);
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const reduce = useReducedMotion();
  const controls = useAnimationControls();
  const [box, setBox] = useState<Box | null>(null);
  // The highlight mounts at the box it has now (so it never shows as a dot), then glides on each change.
  const [mount, setMount] = useState<Box | null>(null);
  const lastBox = useRef<Box | null>(null);
  const [moving, setMoving] = useState(false);
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);

  const measure = useCallback(() => {
    const root = ref.current;
    if (!root || activeKey == null) {
      setBox(null);
      return;
    }
    const el = Array.from(root.querySelectorAll<HTMLElement>("[data-liquid-key]")).find((n) => n.dataset.liquidKey === activeKey);
    if (!el) {
      setBox(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const rr = root.getBoundingClientRect();
    const next = { x: r.left - rr.left + root.scrollLeft, y: r.top - rr.top + root.scrollTop, w: r.width, h: r.height };
    setBox((prev) => (prev && prev.x === next.x && prev.y === next.y && prev.w === next.w && prev.h === next.h ? prev : next));
  }, [activeKey]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(root);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  useLayoutEffect(() => {
    if (box && !mount) setMount(box);
  }, [box, mount]);

  useEffect(() => {
    if (!box || !mount) return;
    const prev = lastBox.current;
    lastBox.current = box;
    if (!prev) return;
    if (reduce) {
      void controls.start({ x: box.x, y: box.y, width: box.w, height: box.h, scaleX: 1, scaleY: 1, skewX: 0, transition: CALM });
      return;
    }
    // Direction of travel: +1 right or down, -1 left or up.
    const dir = Math.sign(box.x - prev.x || box.y - prev.y);
    const place = { x: box.x, y: box.y, width: box.w, height: box.h };

    void controls.start({ ...place, transition: LIQUID });
    // Squish toward the new spot, then settle back round.
    void controls
      .start({ scaleX: 1.16, scaleY: 0.86, skewX: dir * 7, transition: { duration: 0 } })
      .then(() => controls.start({ scaleX: 1, scaleY: 1, skewX: 0, transition: LIQUID }));

    setMoving(true);
    clearTimeout(settle.current);
    settle.current = setTimeout(() => setMoving(false), 700);
  }, [box, mount, controls, reduce]);

  useEffect(() => () => clearTimeout(settle.current), []);

  return (
    <Root ref={ref as React.Ref<HTMLDivElement>} className={cn("relative", className)} {...rest}>
      <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute h-0 w-0 overflow-hidden">
        <defs>
          <filter id={`liquid-${id}`} colorInterpolationFilters="sRGB" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 14 -5" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
      {mount && (
        <m.div
          aria-hidden
          className={cn("pointer-events-none absolute top-0 left-0", indicatorClassName)}
          initial={{ x: mount.x, y: mount.y, width: mount.w, height: mount.h }}
          animate={controls}
          style={{ originX: 0.5, originY: 0.5, filter: moving && !reduce ? `url(#liquid-${id})` : undefined }}
        />
      )}
      {children}
    </Root>
  );
}
