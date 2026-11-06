"use client";

import { cn } from "@/lib/utils";
import { Spirit, type SpiritPose } from "./spirit";

/**
 * Compatibility layer: older screens still ask for the owl's poses. They
 * render the Satify spirit now. New code uses <Spirit /> directly.
 */
export type OwlPose = "happy" | "correct" | "oops" | "thinking";

export const OWL_POSES: OwlPose[] = ["happy", "correct", "oops", "thinking"];

const TO_SPIRIT: Record<OwlPose, SpiritPose> = { happy: "idle", correct: "cheer", oops: "oops", thinking: "think" };

export function Owl({ pose = "happy", size, className, label }: { pose?: OwlPose; size?: number; className?: string; label?: string; bob?: boolean }) {
  return (
    <span className={cn("inline-block w-24 shrink-0", className)} style={size ? { width: size } : undefined}>
      <Spirit pose={TO_SPIRIT[pose]} label={label} className="w-full" />
    </span>
  );
}
