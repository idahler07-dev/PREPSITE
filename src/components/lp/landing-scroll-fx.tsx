"use client";

import { useEffect } from "react";

/**
 * Scroll-linked motion for the landing page (the design itself stays in
 * reference-landing.tsx, untouched). Everything is tied to scroll position,
 * so it plays forward as you scroll down and rewinds as you scroll up:
 *  - hero: the floating product cards drift apart and fade, the headline block
 *    sinks a little slower than the page (parallax)
 *  - every later section: its content rises into place, child by child
 *  - the product preview (#tour): starts tilted back in 3D, flattens as it
 *    reaches the middle of the screen
 *  - decorative layers in sections drift at their own speed
 *  - a thin progress bar along the top
 * Only transforms and opacity change (smooth, no layout work). Off with reduced motion.
 */
const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t: number) => 1 - (1 - t) ** 3;

type Item = { el: HTMLElement; i: number };

export function LandingScrollFx() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.querySelector<HTMLElement>(".ref-lp");
    if (!root) return;

    // progress bar
    const bar = document.createElement("div");
    bar.setAttribute("aria-hidden", "true");
    Object.assign(bar.style, {
      position: "fixed",
      top: "0",
      left: "0",
      right: "0",
      height: "3px",
      background: "linear-gradient(90deg, #0F6B78, #FF6A1A)",
      transformOrigin: "0 50%",
      transform: "scaleX(0)",
      zIndex: "60",
      pointerEvents: "none",
    });
    document.body.appendChild(bar);

    const sections = [...root.querySelectorAll<HTMLElement>("section")].filter(
      (s) => !s.parentElement?.closest("section"),
    );
    const isDeco = (el: HTMLElement) => {
      const pos = getComputedStyle(el).position;
      return (
        pos === "absolute" ||
        pos === "fixed" ||
        el.getAttribute("aria-hidden") === "true"
      );
    };
    const hero = sections[0];
    const heroDeco: Item[] = [];
    const heroMain: HTMLElement[] = [];
    if (hero) {
      for (const c of [...hero.children] as HTMLElement[]) {
        if (isDeco(c)) {
          // floating cards live inside an absolute layer: move each card on its own
          const cards = [...c.children] as HTMLElement[];
          if (cards.length) cards.forEach((el, i) => heroDeco.push({ el, i }));
        } else heroMain.push(c);
      }
    }

    // later sections: content children rise in order; decorative layers drift
    type Sec = {
      s: HTMLElement;
      items: Item[];
      deco: HTMLElement[];
      tilt?: HTMLElement;
    };
    const secs: Sec[] = sections.slice(1).map((s) => {
      const items: Item[] = [];
      const deco: HTMLElement[] = [];
      let k = 0;
      const collect = (parent: HTMLElement, depth: number) => {
        for (const c of [...parent.children] as HTMLElement[]) {
          if (c.tagName === "STYLE") continue;
          if (isDeco(c)) {
            deco.push(c);
            continue;
          }
          // one level down when a section wraps everything in a single container
          if (
            depth === 0 &&
            parent.children.length === 1 &&
            c.children.length > 1
          ) {
            collect(c, 1);
            continue;
          }
          items.push({ el: c, i: k++ });
        }
      };
      collect(s, 0);
      let tilt: HTMLElement | undefined;
      if (s.id === "tour") {
        // the product preview is the tallest content block in the tour
        tilt = items.reduce<HTMLElement | undefined>(
          (best, it) =>
            !best || it.el.offsetHeight > best.offsetHeight ? it.el : best,
          undefined,
        );
      }
      return {
        s,
        items: tilt ? items.filter((it) => it.el !== tilt) : items,
        deco,
        tilt,
      };
    });

    const all = [
      ...heroDeco.map((x) => x.el),
      ...heroMain,
      ...secs.flatMap((x) => [
        ...x.items.map((i) => i.el),
        ...x.deco,
        ...(x.tilt ? [x.tilt] : []),
      ]),
    ];
    for (const el of all) el.style.willChange = "transform, opacity";

    let raf = 0;
    let last = -1;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const y = window.scrollY;
      const vh = window.innerHeight;
      if (y === last) return;
      last = y;

      const max = document.documentElement.scrollHeight - vh;
      bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

      // hero: drift out over the first 80% of a screen
      const h = clamp(y / (vh * 0.8));
      heroDeco.forEach(({ el, i }) => {
        const side =
          el.offsetLeft + el.offsetWidth / 2 < (hero?.offsetWidth ?? 0) / 2
            ? -1
            : 1;
        el.style.transform = `translate3d(${side * h * (50 + i * 12)}px, ${-h * (70 + (i % 3) * 30)}px, 0) rotate(${side * h * 4}deg)`;
        el.style.opacity = String(1 - h * 0.9);
      });
      heroMain.forEach((el, i) => {
        el.style.transform = `translate3d(0, ${h * (40 + i * 6)}px, 0) scale(${1 - h * 0.04})`;
        el.style.opacity = String(1 - h * 0.55);
      });

      for (const { s, items, deco, tilt } of secs) {
        const r = s.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) continue;
        // 0 when the section's top is at the bottom of the screen, 1 at 35% from the top
        const enter = clamp((vh - r.top) / (vh * 0.65));
        items.forEach(({ el, i }) => {
          const t = easeOut(clamp(enter * 1.25 - i * 0.12));
          el.style.transform = `translate3d(0, ${(1 - t) * 56}px, 0)`;
          el.style.opacity = String(0.08 + t * 0.92);
        });
        const through = (vh - r.top) / (vh + r.height);
        deco.forEach((el, i) => {
          el.style.transform = `translate3d(0, ${(through - 0.5) * -(60 + i * 30)}px, 0)`;
        });
        if (tilt) {
          const tr = tilt.getBoundingClientRect();
          // flat once its top reaches 18% of the screen
          const f = easeOut(clamp((vh - tr.top) / (vh * 0.82)));
          tilt.style.transformOrigin = "50% 0%";
          tilt.style.transform = `perspective(1400px) rotateX(${(1 - f) * 24}deg) scale(${0.88 + f * 0.12}) translate3d(0, ${(1 - f) * 40}px, 0)`;
          tilt.style.opacity = String(0.3 + f * 0.7);
        }
      }
    };
    raf = requestAnimationFrame(frame);
    const onResize = () => (last = -1);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      bar.remove();
      for (const el of all) {
        el.style.transform = "";
        el.style.opacity = "";
        el.style.willChange = "";
      }
    };
  }, []);
  return null;
}
