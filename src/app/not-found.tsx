import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { FloatingMascot } from "@/components/mascot/floating-mascot";

export default async function NotFound() {
  const t = await getTranslations("errors");
  const user = await getCurrentUser();
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-section-tint px-6 py-16 text-center">
      <Logo href={user ? "/dashboard" : "/"} />
      <FloatingMascot pose="confused" className="w-44" />
      <p className="font-mono text-small font-semibold text-primary">404</p>
      <h1 className="max-w-[20ch] text-h2 font-semibold lg:text-h1">{t("notFoundTitle")}</h1>
      <p className="max-w-[46ch] text-lead text-muted-foreground">{t("notFoundBody")}</p>
      <Button asChild size="lg" className="rounded-full">
        <Link href={user ? "/dashboard" : "/"}>{user ? t("goDashboard") : t("goHome")}</Link>
      </Button>
    </main>
  );
}
