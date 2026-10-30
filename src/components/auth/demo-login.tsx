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
      <div className="grid gap-2 sm:grid-cols-2">
        <form action={signInAsDemo}>
          <input type="hidden" name="role" value="student" />
          <Button type="submit" className="h-auto min-h-9 w-full whitespace-normal">
            {t("student")}
          </Button>
        </form>
        <form action={signInAsDemo}>
          <input type="hidden" name="role" value="admin" />
          <Button type="submit" variant="outline" className="h-auto min-h-9 w-full whitespace-normal bg-background">
            {t("admin")}
          </Button>
        </form>
      </div>
    </section>
  );
}
