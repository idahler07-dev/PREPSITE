import { Deer, type DeerPose } from "./deer";

/**
 * Compatibility layer: older screens ask for Pip's poses. They render Willo
 * the deer now. New code uses <Deer /> directly.
 */
export type MascotPose = "wave" | "think" | "cheer" | "focus" | "sleepy" | "point" | "juggle" | "confused";

export const MASCOT_POSES: MascotPose[] = ["wave", "think", "cheer", "focus", "sleepy", "point", "juggle", "confused"];

const TO_DEER: Record<MascotPose, DeerPose> = {
  wave: "wink",
  point: "idea",
  focus: "laptop",
  juggle: "jump",
  cheer: "cheer",
  think: "think",
  confused: "think",
  sleepy: "sleep",
};

export function Mascot({ pose, className, label }: { pose: MascotPose; className?: string; label?: string; hoverReact?: boolean }) {
  return <Deer pose={TO_DEER[pose]} className={className} label={label} />;
}
