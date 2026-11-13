import { cn } from "@/lib/utils";
import { LiveWillo, type WilloMood } from "./live-willo";

/**
 * Willo, the WilloPrep deer. Illustrated poses in /public/mascot
 * (deer-<pose>.webp at 720px, deer-<pose>-sm.webp at 360px), cut out on a
 * transparent background so they sit on any surface.
 *
 * Use sparingly: onboarding, empty states, encouragement, milestones.
 * Never inside a timed test.
 */
export const DEER_POSES = {
  stand: [617, 720],
  wink: [604, 720],
  cheer: [620, 720],
  jump: [630, 720],
  trophy: [726, 720],
  heart: [624, 720],
  idea: [660, 720],
  think: [734, 720],
  read: [728, 720],
  laptop: [774, 720],
  sleep: [945, 720],
  sad: [599, 720],
} as const;

export type DeerPose = keyof typeof DEER_POSES;

export function Deer({
  pose = "stand",
  className,
  label,
  float = false,
  priority = false,
  mood = "idle",
}: {
  pose?: DeerPose;
  className?: string;
  label?: string;
  float?: boolean;
  priority?: boolean;
  /** idle (breathe and blink), happy (hop and sparkles) or cry (tears). */
  mood?: WilloMood;
}) {
  const [w, h] = DEER_POSES[pose];
  return (
    <LiveWillo
      src={`/mascot/deer-${pose}.webp`}
      srcSet={`/mascot/deer-${pose}-sm.webp 360w, /mascot/deer-${pose}.webp 720w, /mascot/deer-${pose}-hd.webp 1080w`}
      sizes="(max-width: 640px) 50vw, 240px"
      width={w}
      height={h}
      alt={label ?? ""}
      loading={priority ? "eager" : "lazy"}
      mood={mood}
      className={cn(
        "w-24 shrink-0 select-none",
        float && "deer-float",
        className,
      )}
    />
  );
}
