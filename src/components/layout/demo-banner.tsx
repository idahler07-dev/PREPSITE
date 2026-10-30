import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { env } from "@/lib/env";
import { DEMO_BANNER_COOKIE } from "@/lib/demo-banner";
import { DemoBannerBar } from "./demo-banner-bar";

/**
 * Whether to show the demo notice. NEXT_PUBLIC_DEMO_BANNER ("true"/"false")
 * decides; when it isn't set, the notice follows DEMO_MODE.
 */
export function showDemoBanner(): boolean {
  const flag = process.env.NEXT_PUBLIC_DEMO_BANNER?.trim().toLowerCase();
  if (flag === "true" || flag === "1") return true;
  if (flag === "false" || flag === "0") return false;
  return env().DEMO_MODE;
}

/**
 * Slim (32px) demo notice above the page. Hiding it sets a session cookie, so
 * it stays hidden until the browser is closed and never flashes back on load.
 */
export async function DemoBanner() {
  if ((await cookies()).get(DEMO_BANNER_COOKIE)?.value === "hidden") return null;
  const t = await getTranslations("demo");
  return <DemoBannerBar text={t("banner")} dismissLabel={t("dismiss")} />;
}
