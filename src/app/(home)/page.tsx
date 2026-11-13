import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { ReferenceLanding } from "@/components/lp/reference-landing";

/** College Board weekend SAT dates (2026-27), with the registration deadline for each. */
const SAT_DATES: [string, string, string][] = [
  ["2026-12-05", "Dec 5", "Nov 20"],
  ["2027-03-06", "Mar 6", "Feb 19"],
  ["2027-05-01", "May 1", "Apr 16"],
  ["2027-06-05", "Jun 5", "May 21"],
];

/** Landing page: the approved design, 1:1. Signed-in students go to their dashboard. */
export default async function HomePage() {
  if (await getCurrentUser()) redirect("/dashboard");
  const today = new Date().toISOString().slice(0, 10);
  const next =
    SAT_DATES.find(([d]) => d >= today) ?? SAT_DATES[SAT_DATES.length - 1]!;
  const daysLeft = Math.max(
    0,
    Math.round(
      (Date.parse(`${next[0]}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) /
        86_400_000,
    ),
  );
  return (
    <ReferenceLanding
      nextLabel={`NEXT SAT · ${next[1].toUpperCase()}`}
      daysLeft={daysLeft}
      regBy={next[2]}
    />
  );
}
