import { getTranslations } from "next-intl/server";
import { WilloGallery } from "@/components/mascot/willo-gallery";

export async function generateMetadata() {
  const t = await getTranslations("willo");
  return { title: t("title"), robots: { index: false } };
}

/** Meet Willo: every pose, animated, and a live mood switcher. */
export default async function WilloPage() {
  const t = await getTranslations("willo");
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-14 sm:px-6">
      <h1 className="text-center font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{t("title")}</h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-lg text-muted-foreground">{t("sub")}</p>
      <WilloGallery />
    </div>
  );
}
