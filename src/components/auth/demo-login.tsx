import { getTranslations } from "next-intl/server";
import { signInAsDemo } from "@/server/actions/login";
import { Button } from "@/components/ui/button";

/** Demo site only: sign in without email. */
export async function DemoLogin() {
  const t = await getTranslations("demo");
  return (
    <section aria-labelledby="demo-title" className="mb-6 space-y-3 rounded-xl border border-primary/30 bg-primary-soft/40 p-4">
      <h2 id="demo-title" className="text-sm font-semibold">
        {t("title")}
      </h2>
      <p className="text-sm text-muted-foreground">{t("body")}</p>
      <form action={signInAsDemo}>
        <Button type="submit" className="h-auto min-h-9 w-full whitespace-normal">
          {t("student")}
        </Button>
      </form>
    </section>
  );
}
