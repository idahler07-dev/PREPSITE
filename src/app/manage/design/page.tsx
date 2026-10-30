import { requireOwner } from "@/server/auth/session";
import { Showcase } from "@/components/design/showcase";
import { LogoConcepts } from "@/components/design/logo-concepts";

export const metadata = { title: "Design system", robots: { index: false } };

const TITLE = "Design system";
const SUB = "Every component, token and Pip pose in both themes. See DESIGN.md for the rules.";
const LIGHT = "Light";
const DARK = "Dark";

/** Owners only: the logo concepts and the design system rendered in light and dark side by side. */
export default async function DesignPage() {
  await requireOwner();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-h2 font-semibold">{TITLE}</h1>
        <p className="text-muted-foreground">{SUB}</p>
      </header>
      <LogoConcepts />
      <div className="grid gap-6 2xl:grid-cols-2">
        {[
          { label: LIGHT, cls: "light" },
          { label: DARK, cls: "dark" },
        ].map((th) => (
          <section key={th.cls} className={`${th.cls} rounded-[20px] border bg-background p-6 text-foreground lg:p-10`} aria-label={th.label}>
            <p className="mb-8 font-mono text-label text-muted-foreground uppercase">{th.label}</p>
            <Showcase />
          </section>
        ))}
      </div>
    </div>
  );
}
