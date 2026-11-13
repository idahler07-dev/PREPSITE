"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import EYES from "./eyes.json";
import { cn } from "@/lib/utils";
import { PUPPET_PAD, startPuppet, type Eye } from "./puppet";
import { moodSrc, openSrc } from "./rigs";

/**
 * Any Willo image, alive: a puppet animated every frame (see puppet.ts).
 * He breathes, his head drifts and glances, his arms swing and gesture, the
 * scarf tail trails, and he blinks.
 *  - idle: as above
 *  - happy: his cheering pose, a hop (crouch, lift, land) and a wave
 *  - cry: his own sad pose (drawn tears, soft brows), slower breaths with a
 *    sniffle, and now and then one fresh tear rolling down
 * The plain image renders first (and stays for reduced motion or no WebGL).
 */
export type WilloMood = "idle" | "happy" | "cry";
const DATA = EYES as Record<string, { w: number; h: number; eyes: Eye[] }>;

export function LiveWillo({
  src: baseSrc,
  mood = "idle",
  alt = "",
  className,
  style,
  imgClassName,
  imgStyle,
  width,
  height,
  srcSet: baseSrcSet,
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
  const src = openSrc(moodSrc(baseSrc, mood));
  const srcSet = baseSrcSet ? openSrc(moodSrc(baseSrcSet, mood)) : undefined;
  const info = DATA[src];
  const ref = useRef<HTMLSpanElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [seen, setSeen] = useState(false);
  const [live, setLive] = useState(false);
  const moodRef = useRef(mood);
  const eyesRef = useRef<Eye[]>(info?.eyes ?? []);
  moodRef.current = mood;
  eyesRef.current = info?.eyes ?? [];

  // Animate only while on screen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(!!e?.isIntersecting), {
      rootMargin: "80px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!seen || !img.current || !canvas.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const stop = startPuppet({
      canvas: canvas.current,
      img: img.current,
      eyes: () => eyesRef.current,
      mood: () => moodRef.current,
      onFirst: () => setLive(true),
    });
    return () => stop?.();
  }, [seen]);

  const W = info?.w ?? width ?? 100;
  const H = info?.h ?? height ?? 100;
  const pad = `${-PUPPET_PAD * 100}%`;
  const size = `${(1 + 2 * PUPPET_PAD) * 100}%`;

  return (
    <span
      ref={ref}
      data-mood={mood}
      className={cn("willo-live", className)}
      style={style}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static mascot art, animated by the canvas above it */}
      <img
        ref={img}
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
        style={{ ...imgStyle, opacity: live ? 0 : undefined }}
      />
      <canvas
        ref={canvas}
        aria-hidden
        className="wl-canvas"
        style={{ left: pad, top: pad, width: size, height: size }}
      />
    </span>
  );
}
