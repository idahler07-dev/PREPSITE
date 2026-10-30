import { getTranslations } from "next-intl/server";
import { MailCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function CheckEmailPage() {
  const t = await getTranslations("auth");
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <MailCheck className="mx-auto mb-4 size-12 text-primary" aria-hidden />
      <h1 className="text-2xl font-bold">{t("checkEmailTitle")}</h1>
      <p className="mt-3 text-muted-foreground">{t("checkEmailBody")}</p>
      <p className="mt-2 text-sm text-muted-foreground">{t("checkEmailSpam")}</p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/login">{t("tryAgain")}</Link>
      </Button>
    </div>
  );
}
