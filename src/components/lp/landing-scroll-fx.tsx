"use client";

import { useEffect } from "react";

/**
 * The landing page's scroll story (the design itself stays in reference-landing.tsx).
 *
 * Pinned scenes (scroll-scene.tsx) hold the screen still while scrolling plays them:
 *  - hero: the floating product cards fly in toward the score and fade, the
 *    laurels open out, "1600" grows, the rest of the hero lifts away
 *  - tour: the product window flattens out of a 3D tilt, then the camera moves
 *    through it (predicted score, today's plan, Willo's tip) and back out, with
 *    the matching tab lighting up above
 *  - steps: the three "How it works" cards arrive one after another
 * Everywhere else, section content rises into place as it comes into view.
 * A thin progress bar runs along the top. Everything rewinds when scrolling up.
 * Transforms and opacity only; off with reduced motion.
 */
const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const isDeco = (el: HTMLElement) => {
  const pos = getComputedStyle(el).position;
  return (
    pos === "absolute" ||
    pos === "fixed" ||
    el.getAttribute("aria-hidden") === "true"
  );
};
const byText = (root: HTMLElement, text: RegExp) => {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode())
    if (text.test(n.textContent ?? "")) return n.parentElement;
  return null;
};
/** The card around a label: the nearest ancestor wider than `min` px. */
const cardOf = (el: HTMLElement | null, stop: HTMLElement, min = 170) => {
  let c = el;
  while (c && c !== stop && c.offsetWidth < min) c = c.parentElement;
  return c && c !== stop ? c : null;
};

export function LandingScrollFx() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.querySelector<HTMLElement>(".ref-lp");
    if (!root) return;
    const touched = new Set<HTMLElement>();
    const set = (el: HTMLElement, transform: string, opacity?: number) => {
      touched.add(el);
      el.style.transform = transform;
      if (opacity !== undefined) el.style.opacity = String(opacity);
    };

    // ── progress bar ──
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

    // ── hero scene ──
    const heroScene = root.querySelector<HTMLElement>('[data-scene="hero"]');
    const hero = heroScene?.querySelector<HTMLElement>("section") ?? null;
    const heroCards: HTMLElement[] = [];
    const heroLift: HTMLElement[] = [];
    let score: HTMLElement | null = null;
    let laurels: HTMLElement[] = [];
    if (hero) {
      for (const c of [...hero.children] as HTMLElement[]) {
        if (isDeco(c)) heroCards.push(...([...c.children] as HTMLElement[]));
      }
      const n1600 = byText(hero, /^\s*1600\s*$/);
      score = n1600;
      const row = n1600?.parentElement ?? null;
      laurels = row
        ? ([...row.children].filter(
            (x) => x.tagName.toLowerCase() === "svg",
          ) as HTMLElement[])
        : [];
      const main = [...hero.children].find((c) => !isDeco(c as HTMLElement)) as
        | HTMLElement
        | undefined;
      if (main)
        for (const c of [...main.children] as HTMLElement[])
          if (row && !c.contains(row)) heroLift.push(c);
    }
    const heroCenter = () => {
      const r = score?.getBoundingClientRect();
      return r
        ? { x: r.left + r.width / 2, y: r.top + r.height / 2 }
        : { x: innerWidth / 2, y: innerHeight / 2 };
    };
    // card offsets toward the score, measured untransformed
    let cardVec: { dx: number; dy: number }[] = [];
    // how much a pinned scene is scaled to fit the screen (set after mount)
    const scaleOf = (el: HTMLElement | null) =>
      el ? el.getBoundingClientRect().width / (el.offsetWidth || 1) : 1;
    let heroK = 0;
    const measureHero = () => {
      heroCards.forEach((el) => (el.style.transform = ""));
      const c = heroCenter();
      // the scene may be scaled to fit the screen: move in its own pixels
      const k = scaleOf(hero);
      heroK = k;
      cardVec = heroCards.map((el) => {
        const r = el.getBoundingClientRect();
        return {
          dx: (c.x - (r.left + r.width / 2)) / k,
          dy: (c.y - (r.top + r.height / 2)) / k,
        };
      });
    };
    measureHero();
    const playHero = (p: number) => {
      if (Math.abs(scaleOf(hero) - heroK) > 0.005) measureHero();
      const fly = ease(seg(p, 0, 0.7));
      heroCards.forEach((el, i) => {
        const v = cardVec[i] ?? { dx: 0, dy: 0 };
        set(
          el,
          `translate3d(${v.dx * 0.75 * fly}px, ${v.dy * 0.75 * fly}px, 0) scale(${1 - 0.45 * fly}) rotate(${(i % 2 ? 1 : -1) * 8 * fly}deg)`,
          1 - seg(p, 0.35, 0.72),
        );
      });
      const open = ease(seg(p, 0.1, 0.8));
      laurels.forEach((el, i) => {
        const side = i === 0 ? -1 : 1;
        el.style.transformOrigin = "50% 100%";
        set(
          el,
          `translate3d(${side * 46 * open}px, ${-10 * open}px, 0) rotate(${side * 16 * open}deg) scale(${1 + 0.18 * open})`,
        );
      });
      if (score) set(score, `scale(${1 + 0.32 * ease(seg(p, 0.1, 0.85))})`);
      const lift = ease(seg(p, 0.35, 1));
      heroLift.forEach((el, i) =>
        set(
          el,
          `translate3d(0, ${-lift * (34 + i * 10)}px, 0)`,
          1 - lift * 0.92,
        ),
      );
    };

    // ── tour scene ──
    const tourScene = root.querySelector<HTMLElement>('[data-scene="tour"]');
    const tour = tourScene?.querySelector<HTMLElement>("section") ?? null;
    let win: HTMLElement | null = null;
    let cam: HTMLElement | null = null;
    const tabs: HTMLButtonElement[] = tour
      ? [...tour.querySelectorAll<HTMLButtonElement>("button")]
      : [];
    const tabStyle = tabs.map((b) => ({
      bg: b.style.background,
      sh: b.style.boxShadow,
      c: b.style.color,
      fw: b.style.fontWeight,
    }));
    const activeIdx = Math.max(
      0,
      tabStyle.findIndex((s) => /fff/i.test(s.bg)),
    );
    if (tour) {
      const blocks = ([...tour.children] as HTMLElement[]).filter(
        (c) => !isDeco(c) && c.tagName !== "STYLE",
      );
      win = blocks.reduce<HTMLElement | null>(
        (a, b) => (!a || b.offsetHeight > a.offsetHeight ? b : a),
        null,
      );
      // the browser frame: its last child is the page inside it
      const frame =
        win?.querySelector<HTMLElement>('[style*="border-radius"]') ?? win;
      cam = (frame?.lastElementChild as HTMLElement | null) ?? null;
      if (frame) frame.style.overflow = "hidden";
    }
    type Stop = { el: HTMLElement | null; s: number; tab: RegExp };
    const stops: Stop[] = cam
      ? [
          { el: null, s: 1, tab: /^Dashboard$/ },
          {
            el: cardOf(byText(cam, /PREDICTED SCORE/), cam, 260),
            s: 1.55,
            tab: /^Score report$/,
          },
          {
            el: cardOf(byText(cam, /Today.s plan/), cam),
            s: 1.7,
            tab: /^Study plan$/,
          },
          {
            el: cardOf(byText(cam, /Start drill/), cam),
            s: 1.75,
            tab: /^Willo AI$/,
          },
          { el: null, s: 1, tab: /^Dashboard$/ },
        ]
      : [];
    let stopPos: { x: number; y: number }[] = [];
    let camSize = { w: 1, h: 1 };
    let tourK = 0;
    const measureTour = () => {
      if (!cam) return;
      tourK = scaleOf(tour);
      cam.style.transform = "";
      if (win) win.style.transform = "";
      const base = cam.getBoundingClientRect();
      // the scene may be scaled to fit the screen: work in the camera's own pixels
      const k = base.width / (cam.offsetWidth || 1);
      camSize = { w: cam.offsetWidth, h: cam.offsetHeight };
      stopPos = stops.map((st) => {
        if (!st.el) return { x: camSize.w / 2, y: camSize.h / 2 };
        const r = st.el.getBoundingClientRect();
        return {
          x: (r.left - base.left + r.width / 2) / k,
          y: (r.top - base.top + r.height / 2) / k,
        };
      });
    };
    measureTour();
    // keyframes: [progress, stop index]
    const KEYS: [number, number][] = [
      [0.18, 0],
      [0.32, 1],
      [0.42, 1],
      [0.56, 2],
      [0.66, 2],
      [0.8, 3],
      [0.88, 3],
      [1, 4],
    ];
    const playTour = (p: number) => {
      if (!win || !cam) return;
      if (Math.abs(scaleOf(tour) - tourK) > 0.005) measureTour();
      const flat = ease(seg(p, 0, 0.18));
      win.style.transformOrigin = "50% 100%";
      set(
        win,
        `perspective(1600px) rotateX(${(1 - flat) * 22}deg) scale(${0.9 + 0.1 * flat})`,
        0.35 + 0.65 * flat,
      );
      // camera position between keyframes
      let x = stopPos[0]?.x ?? 0;
      let y = stopPos[0]?.y ?? 0;
      let s = 1;
      let tabAt = 0;
      for (let k = 0; k < KEYS.length - 1; k++) {
        const [pa, ia] = KEYS[k]!;
        const [pb, ib] = KEYS[k + 1]!;
        if (p <= pa && k === 0) break;
        if (p >= pa && p <= pb) {
          const t = ease(seg(p, pa, pb));
          const A = stopPos[ia]!;
          const B = stopPos[ib]!;
          x = lerp(A.x, B.x, t);
          y = lerp(A.y, B.y, t);
          s = lerp(stops[ia]!.s, stops[ib]!.s, t);
          tabAt = t < 0.5 ? ia : ib;
          break;
        }
      }
      cam.style.transformOrigin = "0 0";
      set(
        cam,
        `translate3d(${camSize.w / 2 - x * s}px, ${camSize.h / 2 - y * s}px, 0) scale(${s})`,
      );
      // the matching tab lights up
      const want = stops[tabAt]?.tab;
      const on = tabs.findIndex((b) => want?.test(b.textContent?.trim() ?? ""));
      const onStyle = tabStyle[activeIdx];
      const offStyle = tabStyle[activeIdx === 0 ? 1 : 0];
      tabs.forEach((b, i) => {
        const st = i === on ? onStyle : offStyle;
        if (!st) return;
        b.style.background = st.bg;
        b.style.boxShadow = st.sh;
        b.style.color = st.c;
        b.style.fontWeight = st.fw;
      });
    };

    // ── steps scene ──
    const stepsScene = root.querySelector<HTMLElement>('[data-scene="steps"]');
    let stepCards: HTMLElement[] = [];
    if (stepsScene) {
      const grids = [...stepsScene.querySelectorAll<HTMLElement>("div")].filter(
        (d) =>
          d.children.length === 3 &&
          [...d.children].every((c) => (c as HTMLElement).offsetHeight > 150),
      );
      stepCards = grids[0] ? ([...grids[0].children] as HTMLElement[]) : [];
    }
    const playSteps = (p: number) => {
      stepCards.forEach((el, i) => {
        const t = easeOut(seg(p, 0.05 + i * 0.27, 0.35 + i * 0.27));
        const active =
          seg(p, 0.05 + i * 0.27, 0.35 + i * 0.27) > 0 &&
          seg(p, 0.32 + i * 0.27, 0.45 + i * 0.27) < 1;
        set(
          el,
          `translate3d(0, ${(1 - t) * 120}px, 0) scale(${0.86 + 0.14 * t + (active && i < 2 ? 0.02 * t : 0)})`,
          t,
        );
      });
    };

    // ── everything else: content rises into place ──
    const scenes = [heroScene, tourScene, stepsScene].filter(
      Boolean,
    ) as HTMLElement[];
    const free = [...root.querySelectorAll<HTMLElement>("section")].filter(
      (s) =>
        !s.parentElement?.closest("section") &&
        !scenes.some((sc) => sc.contains(s)),
    );
    type Rise = { s: HTMLElement; items: HTMLElement[]; deco: HTMLElement[] };
    const rises: Rise[] = free.map((s) => {
      const items: HTMLElement[] = [];
      const deco: HTMLElement[] = [];
      const collect = (parent: HTMLElement, depth: number) => {
        for (const c of [...parent.children] as HTMLElement[]) {
          if (c.tagName === "STYLE") continue;
          if (isDeco(c)) deco.push(c);
          else if (
            depth === 0 &&
            parent.children.length === 1 &&
            c.children.length > 1
          )
            collect(c, 1);
          else items.push(c);
        }
      };
      collect(s, 0);
      return { s, items, deco };
    });
    const playRises = () => {
      const vh = innerHeight;
      for (const { s, items, deco } of rises) {
        const r = s.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) continue;
        const enter = clamp((vh - r.top) / (vh * 0.65));
        items.forEach((el, i) => {
          const t = easeOut(clamp(enter * 1.25 - i * 0.12));
          set(el, `translate3d(0, ${(1 - t) * 56}px, 0)`, 0.08 + t * 0.92);
        });
        const through = (vh - r.top) / (vh + r.height);
        deco.forEach((el, i) =>
          set(el, `translate3d(0, ${(through - 0.5) * -(60 + i * 30)}px, 0)`),
        );
      }
    };

    const onScene = (e: Event) => {
      const { name, p } = (e as CustomEvent<{ name: string; p: number }>)
        .detail;
      if (name === "hero") playHero(p);
      else if (name === "tour") playTour(p);
      else if (name === "steps") playSteps(p);
    };
    window.addEventListener("landing-scene", onScene);

    let raf = 0;
    let last = -1;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const y = scrollY;
      if (y === last) return;
      last = y;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      playRises();
    };
    raf = requestAnimationFrame(frame);
    playHero(0);
    playTour(0);
    playSteps(0);

    const onResize = () => {
      last = -1;
      measureHero();
      measureTour();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("landing-scene", onScene);
      window.removeEventListener("resize", onResize);
      bar.remove();
      for (const el of touched) {
        el.style.transform = "";
        el.style.opacity = "";
      }
      tabs.forEach((b, i) => {
        const st = tabStyle[i]!;
        b.style.background = st.bg;
        b.style.boxShadow = st.sh;
        b.style.color = st.c;
        b.style.fontWeight = st.fw;
      });
    };
  }, []);
  return null;
}
