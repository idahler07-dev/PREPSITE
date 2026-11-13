"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import EYES from "./eyes.json";
import { cn } from "@/lib/utils";

/**
 * Any Willo image, brought to life in a paper-cut, stop-motion style at 24 fps:
 * breathing, a slight paper "boil", natural blinks, and moods.
 *  - idle: breathes and blinks
 *  - happy: a hop with paper sparkles
 *  - cry: heavy lids, a shiver, and tears that well up, run down the cheeks and drip
 * Eye positions come from scripts/willo-eyes.py (src/components/mascot/eyes.json).
 * Honours prefers-reduced-motion (static, with one still tear when crying).
 */
export type WilloMood = "idle" | "happy" | "cry";
type Eye = { x: number; y: number; rx: number; ry: number; fur: string };
const DATA = EYES as Record<string, { w: number; h: number; eyes: Eye[] }>;
const LASH = "#3a2416";
const TEAR = "#7cc8ec";

export function LiveWillo({
  src,
  mood = "idle",
  alt = "",
  className,
  style,
  imgClassName,
  imgStyle,
  width,
  height,
  srcSet,
  sizes,
  loading,
}: {
  src: string;
  mood?: WilloMood;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  imgClassName?: string;
  imgStyle?: CSSProperties;
  width?: number;
  height?: number;
  srcSet?: string;
  sizes?: string;
  loading?: "eager" | "lazy";
}) {
  const info = DATA[src];
  const uid = "wl" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const ref = useRef<HTMLSpanElement>(null);
  const [blink, setBlink] = useState(0);
  const [seen, setSeen] = useState(false);

  // Animate only while on screen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(!!e?.isIntersecting), {
      rootMargin: "60px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Natural blinking: every 2.5–6 s, sometimes a quick double blink.
  useEffect(() => {
    if (
      !seen ||
      !info?.eyes.length ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    let t: ReturnType<typeof setTimeout>;
    const next = () => {
      t = setTimeout(
        () => {
          setBlink((b) => b + 1);
          if (Math.random() < 0.22)
            setTimeout(() => setBlink((b) => b + 1), 320);
          next();
        },
        2500 + Math.random() * 3500,
      );
    };
    next();
    return () => clearTimeout(t);
  }, [seen, info]);

  const W = info?.w ?? width ?? 100;
  const H = info?.h ?? height ?? 100;
  const eyes = info?.eyes ?? [];

  return (
    <span
      ref={ref}
      data-mood={mood}
      data-live={seen ? "on" : "off"}
      className={cn("willo-live", className)}
      style={style}
    >
      <span className="wl-body">
        <span className="wl-boil">
          {/* eslint-disable-next-line @next/next/no-img-element -- static mascot art with a live overlay */}
          <img
            src={src}
            srcSet={srcSet}
            sizes={sizes}
            loading={loading}
            decoding="async"
            alt={alt}
            aria-hidden={alt ? undefined : true}
            width={width ?? W}
            height={height ?? H}
            draggable={false}
            className={cn("wl-img", imgClassName)}
            style={imgStyle}
          />
          {(eyes.length > 0 || mood !== "idle") && (
            <svg
              className="wl-over"
              viewBox={`0 0 ${W} ${H}`}
              aria-hidden
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {eyes.map((e, i) => (
                  <clipPath key={i} id={`${uid}-c${i}`}>
                    <ellipse
                      cx={e.x * W}
                      cy={e.y * H}
                      rx={e.rx * W * 1.08}
                      ry={e.ry * H * 1.06}
                    />
                  </clipPath>
                ))}
              </defs>
              {eyes.map((e, i) => {
                const cx = e.x * W;
                const cy = e.y * H;
                const rx = e.rx * W * 1.12;
                const ry = e.ry * H * 1.08;
                return (
                  <g key={`${i}-${blink}`}>
                    <g clipPath={`url(#${uid}-c${i})`}>
                      <linearGradient
                        id={`${uid}-g${i}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0" stopColor={e.fur} />
                        <stop offset="0.85" stopColor={e.fur} />
                        <stop offset="1" stopColor={shade(e.fur, 0.86)} />
                      </linearGradient>
                      <g
                        className={cn("wl-lid", blink > 0 && "wl-lid-blink")}
                        style={{ ["--lid" as string]: `${ry}px` }}
                      >
                        <rect
                          x={cx - rx}
                          y={cy - ry * 3.2}
                          width={rx * 2}
                          height={ry * 2.2}
                          fill={`url(#${uid}-g${i})`}
                        />
                        <path
                          d={`M${cx - rx * 0.92} ${cy - ry * 1.04} Q${cx} ${cy - ry * 0.52} ${cx + rx * 0.92} ${cy - ry * 1.04}`}
                          fill="none"
                          stroke={LASH}
                          strokeWidth={ry * 0.15}
                          strokeLinecap="round"
                        />
                      </g>
                    </g>
                    {/* the closed-eye curve, drawn over the fur while the lid is fully shut */}
                    <path
                      className={cn("wl-shut", blink > 0 && "wl-shut-blink")}
                      d={`M${cx - rx * 0.9} ${cy + ry * 0.05} Q${cx} ${cy + ry * 0.6} ${cx + rx * 0.9} ${cy + ry * 0.05}`}
                      fill="none"
                      stroke={LASH}
                      strokeWidth={ry * 0.2}
                      strokeLinecap="round"
                    />
                  </g>
                );
              })}
              {mood === "cry" &&
                eyes.map((e, i) => {
                  const side = eyes.length === 1 ? 1 : i === 0 ? -1 : 1;
                  const x = (e.x + side * e.rx * 0.55) * W;
                  const y = (e.y + e.ry * 0.8) * H;
                  const r = e.ry * H * 0.28;
                  const drop = `M0 ${-r * 1.7} C ${r * 0.55} ${-r * 0.6} ${r} 0 ${r} ${r * 0.35} A ${r} ${r} 0 1 1 ${-r} ${r * 0.35} C ${-r} 0 ${-r * 0.55} ${-r * 0.6} 0 ${-r * 1.7}Z`;
                  return (
                    <g
                      key={`t${i}`}
                      className="wl-tears"
                      transform={`translate(${x} ${y})`}
                      style={{ ["--fall" as string]: `${e.ry * H * 3.4}px` }}
                    >
                      <path
                        className="wl-stream"
                        d={`M0 0 C ${side * r * 0.6} ${e.ry * H} ${side * r * 0.9} ${e.ry * H * 2} ${side * r * 0.5} ${e.ry * H * 3}`}
                        fill="none"
                        stroke={TEAR}
                        strokeOpacity={0.55}
                        strokeWidth={r * 0.7}
                        strokeLinecap="round"
                      />
                      {[0, 1, 2].map((d) => (
                        <g
                          key={d}
                          className="wl-drop"
                          style={{ animationDelay: `${d * 0.5 + i * 0.25}s` }}
                        >
                          <path
                            d={drop}
                            fill={TEAR}
                            stroke="#3e8fbf"
                            strokeWidth={r * 0.16}
                          />
                          <ellipse
                            cx={-r * 0.32}
                            cy={r * 0.05}
                            rx={r * 0.22}
                            ry={r * 0.36}
                            fill="#fff"
                            opacity={0.85}
                          />
                        </g>
                      ))}
                    </g>
                  );
                })}
              {mood === "happy" &&
                sparkSpots(eyes).map(([x, y, sc], i) => (
                  <g
                    key={`s${i}`}
                    transform={`translate(${x * W} ${y * H}) scale(${(sc * W) / 500})`}
                  >
                    <g
                      className="wl-spark"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    >
                      <path
                        d="M0 -40 L10 -10 L40 0 L10 10 L0 40 L-10 10 L-40 0 L-10 -10Z"
                        fill="#f6c453"
                        stroke="#b77a14"
                        strokeWidth={4}
                        strokeLinejoin="round"
                      />
                    </g>
                  </g>
                ))}
            </svg>
          )}
        </span>
      </span>
    </span>
  );
}

/** Darken a #rrggbb colour (k < 1). */
function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.round(v * k),
  );
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Three sparkle spots around the head: from the eyes when known, else the top corners. */
function sparkSpots(eyes: Eye[]): [number, number, number][] {
  if (eyes.length === 0)
    return [
      [0.16, 0.14, 1],
      [0.84, 0.1, 0.8],
      [0.9, 0.4, 0.6],
    ];
  const l = eyes[0]!;
  const r = eyes[eyes.length - 1]!;
  return [
    [l.x - l.rx * 3.2, l.y - l.ry * 2.6, 1],
    [r.x + r.rx * 3, r.y - r.ry * 3.2, 0.85],
    [r.x + r.rx * 3.6, r.y + r.ry * 0.6, 0.6],
  ];
}
