import { cn } from "@/lib/utils";
import type { DeerPose } from "./deer";
import { moodFor } from "./live-willo";
import { WilloBox } from "./willo-box";

/** Willo in a named pose, as the compact vector Willo (willo-box.tsx). */
export function Willo({
  pose = "stand",
  className,
  label,
}: {
  pose?: DeerPose;
  className?: string;
  label?: string;
  shadow?: boolean;
}) {
  return (
    <WilloBox
      mood={moodFor(`deer-${pose}`)}
      label={label}
      className={cn("w-40 shrink-0", className)}
    />
  );
}
