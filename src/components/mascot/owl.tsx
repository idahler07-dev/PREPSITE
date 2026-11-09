import { cn } from "@/lib/utils";
import { Deer, type DeerPose } from "./deer";

/**
 * Compatibility layer: older screens still ask for the owl's poses. They
 * render Willo the deer now. New code uses <Deer /> directly.
 */
export type OwlPose = "happy" | "correct" | "oops" | "thinking";

export const OWL_POSES: OwlPose[] = ["happy", "correct", "oops", "thinking"];

/** A wrong answer gets the thoughtful pose, never tears. */
const TO_DEER: Record<OwlPose, DeerPose> = { happy: "stand", correct: "cheer", oops: "think", thinking: "think" };

export function Owl({ pose = "happy", className, label }: { pose?: OwlPose; size?: number; className?: string; label?: string; bob?: boolean }) {
  return <Deer pose={TO_DEER[pose]} label={label} className={cn("w-24", className)} />;
}
