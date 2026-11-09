import { cn } from "@/lib/utils";

/**
 * Willo, the WilloPrep deer. Illustrated poses in /public/mascot
 * (deer-<pose>.webp at 720px, deer-<pose>-sm.webp at 360px), cut out on a
 * transparent background so they sit on any surface.
 *
 * Use sparingly: onboarding, empty states, encouragement, milestones.
 * Never inside a timed test.
 */
export const DEER_POSES = {
  stand: [615, 720],
  wink: [604, 720],
  cheer: [618, 720],
  jump: [629, 720],
  trophy: [720, 713],
  heart: [623, 720],
  idea: [659, 720],
  think: [720, 706],
  read: [720, 713],
  laptop: [720, 668],
  sleep: [720, 546],
  sad: [598, 720],
} as const;

export type DeerPose = keyof typeof DEER_POSES;

export function Deer({ pose = "stand", className, label, float = false, priority = false }: { pose?: DeerPose; className?: string; label?: string; float?: boolean; priority?: boolean }) {
  const [w, h] = DEER_POSES[pose];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- small static WebP with srcset; next/image adds nothing here
    <img
      src={`/mascot/deer-${pose}.webp`}
      srcSet={`/mascot/deer-${pose}-sm.webp 360w, /mascot/deer-${pose}.webp 720w`}
      sizes="(max-width: 640px) 50vw, 240px"
      width={w}
      height={h}
      alt={label ?? ""}
      aria-hidden={label ? undefined : true}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className={cn("inline-block h-auto w-24 shrink-0 select-none", float && "deer-float", className)}
    />
  );
}
