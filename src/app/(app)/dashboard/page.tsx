import { redirect } from "next/navigation";

/** The dashboard is now the Path (brief §5). Old links and bookmarks land there. */
export default function DashboardPage() {
  redirect("/sat");
}
