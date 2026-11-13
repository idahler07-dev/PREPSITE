"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A pinned scroll scene: the content stays on screen while the page scrolls
 * through `length` (a share of the screen height), and that scroll plays the
 * scene like scrubbing a video, forward and back. When the content is taller
 * than the space below the site's sticky header, it is scaled down to fit while
 * pinned, so the whole scene stays in view.
 *
 * Each frame the scene's progress (0..1) is published as `--p` and
 * `data-progress` on the pinned element and as a `landing-scene` event, which
 * landing-scroll-fx.tsx turns into the actual animation. With reduced motion
 * the content is simply shown, not pinned.
 */
export function ScrollScene({
  name,
  length,
  mobileLength,
  children,
}: {
  name: string;
  /** How much scrolling the scene takes, in % of the screen height. */
  length: number;
  /** The same on narrow screens (shorter, so it never feels stuck). */
  mobileLength?: number;
  children: ReactNode;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const fit = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    const f = fit.current;
    if (!o || !i || !f) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let len = 0;
    let top = 0;
    const measure = () => {
      const vh = window.innerHeight;
      const narrow = window.innerWidth < 768;
      len = (((narrow ? mobileLength : undefined) ?? length) / 100) * vh;
      // the site header stays on top: fit the scene into the space below it
      const header = document.querySelector<HTMLElement>(".ref-lp header");
      const hh =
        header && /sticky|fixed/.test(getComputedStyle(header).position)
          ? header.offsetHeight
          : 0;
      const h = f.offsetHeight;
      const room = vh - hh;
      const k = Math.min(1, room / h);
      f.style.transform = k < 1 ? `scale(${k})` : "";
      f.style.transformOrigin = "50% 0";
      const shown = h * k;
      // pin with the scene just under the header, centred in the room left
      top = hh + Math.max(0, (room - shown) / 2);
      i.style.top = `${top}px`;
      i.style.height = `${shown}px`;
      o.style.height = `${shown + len}px`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(f);
    window.addEventListener("resize", measure);

    let raf = 0;
    let last = -1;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const r = o.getBoundingClientRect();
      const p = len > 0 ? Math.min(1, Math.max(0, (top - r.top) / len)) : 0;
      if (Math.abs(p - last) < 0.0005) return;
      last = p;
      i.style.setProperty("--p", p.toFixed(4));
      i.dataset.progress = p.toFixed(4);
      window.dispatchEvent(
        new CustomEvent("landing-scene", { detail: { name, p, el: i } }),
      );
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
      o.style.height = "";
      i.style.top = "";
      i.style.height = "";
      f.style.transform = "";
    };
  }, [length, mobileLength, name]);

  return (
    <div ref={outer} data-scene={name} style={{ position: "relative" }}>
      <div ref={inner} style={{ position: "sticky", top: 0 }}>
        <div ref={fit}>{children}</div>
      </div>
    </div>
  );
}
