import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { WilloBox, type WilloBoxMood, type WilloBoxProp } from "./willo-box";

/**
 * Willo wherever the site shows him: the compact vector Willo (willo-box.tsx).
 * Older call sites still name an illustration (`src`); its pose picks the mood,
 * and `mood` (happy, cry) overrides it.
 */
export type WilloMood = "idle" | "happy" | "cry";

const BY_POSE: [RegExp, WilloBoxMood][] = [
  [/wink/, "wink"],
  [/cheer|jump|trophy|heart/, "happy"],
  [/idea/, "wow"],
  [/think/, "think"],
  [/sad/, "sad"],
  [/sleep/, "sleep"],
];

export function moodFor(
  src: string | undefined,
  mood: WilloMood = "idle",
): WilloBoxMood {
  if (mood === "happy") return "happy";
  if (mood === "cry") return "sad";
  const name = (src ?? "").split("/").pop() ?? "";
  return BY_POSE.find(([re]) => re.test(name))?.[1] ?? "idle";
}

/** Reading and studying poses hold a book or a laptop. */
export function propFor(src: string | undefined): WilloBoxProp | undefined {
  const name = (src ?? "").split("/").pop() ?? "";
  return /read/.test(name)
    ? "book"
    : /laptop/.test(name)
      ? "laptop"
      : undefined;
}

export function LiveWillo({
  src,
  mood = "idle",
  alt = "",
  className,
  style,
  imgStyle,
}: {
  src?: string;
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
  return (
    <span
      className={cn("inline-block", className)}
      style={{ ...imgStyle, ...style }}
    >
      <WilloBox
        mood={moodFor(src, mood)}
        prop={mood === "idle" ? propFor(src) : undefined}
        label={alt || undefined}
        className="w-full"
      />
    </span>
  );
}
