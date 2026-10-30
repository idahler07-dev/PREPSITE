import { getTranslations } from "next-intl/server";
import { signInAsDemo } from "@/server/actions/login";
import { Button } from "@/components/ui/button";

/** Demo site only: sign in without email. */
export async function DemoLogin() {
  const t = await getTranslations("demo");
  return (
    <section aria-labelledby="demo-title" className="mb-8 space-y-3 rounded-lg border-2 border-primary/40 bg-accent/40 p-4">
      <h2 id="demo-title" className="font-semibold">
        {t("title")}
      </h2>
      <p className="text-sm text-muted-foreground">{t("body")}</p>
      <div className="flex flex-wrap gap-2">
        <form action={signInAsDemo}>
          <input type="hidden" name="role" value="student" />
          <Button type="submit">{t("student")}</Button>
        </form>
        <form action={signInAsDemo}>
          <input type="hidden" name="role" value="admin" />
          <Button type="submit" variant="outline">
            {t("admin")}
          </Button>
        </form>
      </div>
    </section>
  );
}
