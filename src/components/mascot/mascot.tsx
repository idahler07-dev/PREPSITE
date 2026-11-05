import { Owl, type OwlPose } from "./owl";

/**
 * Compatibility layer: older screens ask for Pip's poses. They all render the
 * owl now, mapped onto its four expressions. New code uses <Owl /> directly.
 */
export type MascotPose = "wave" | "think" | "cheer" | "focus" | "sleepy" | "point" | "juggle" | "confused";

export const MASCOT_POSES: MascotPose[] = ["wave", "think", "cheer", "focus", "sleepy", "point", "juggle", "confused"];

const TO_OWL: Record<MascotPose, OwlPose> = {
  wave: "happy",
  point: "happy",
  focus: "happy",
  juggle: "happy",
  cheer: "correct",
  think: "thinking",
  confused: "oops",
  sleepy: "oops",
};

export function Mascot({ pose, className, label }: { pose: MascotPose; className?: string; label?: string; hoverReact?: boolean }) {
  return <Owl pose={TO_OWL[pose]} className={className} label={label} />;
}
