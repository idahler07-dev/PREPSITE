import { getTranslations } from "next-intl/server";

/** Four plain facts between hairlines (no invented numbers). */
export async function LpFacts() {
  const t = await getTranslations("lp");
  const facts = t.raw("facts") as { t: string; d: string }[];
  return (
    <section className="mx-auto grid max-w-[1176px] grid-cols-2 border-y px-0 md:grid-cols-4">
      {facts.map((f, i) => (
        <div
          key={f.t}
          className={`px-6 py-8 sm:px-8 ${i % 2 ? "border-s" : ""} ${i > 0 ? "md:border-s" : ""} ${i > 1 ? "border-t md:border-t-0" : ""}`}
        >
          <div className="text-3xl font-black tracking-[-0.05em]">{f.t}</div>
          <div className="mt-1 text-sm text-muted-foreground">{f.d}</div>
        </div>
      ))}
    </section>
  );
}
