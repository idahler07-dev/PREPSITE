import { Mascot, type MascotPose } from "./mascot";

/** The owl on the 404 and error pages (it bobs on its own). */
export function FloatingMascot({
  pose,
  className,
}: {
  pose: MascotPose;
  className?: string;
}) {
  return <Mascot pose={pose} className={className} />;
}
