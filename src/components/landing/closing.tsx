import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Owl } from "@/components/mascot/owl";

export interface Testimonial {
  quote: string;
  name: string;
  detail: string;
}

/**
 * Real student quotes only, with their permission. Empty means the section
 * stays hidden: never fill this with invented quotes.
 */
export const TESTIMONIALS: Testimonial[] = [];

export async function Testimonials() {
  if (TESTIMONIALS.length === 0) return null;
  const t = await getTranslations("landing.testimonials");
  return (
    <section aria-labelledby="testimonials-title" className="mx-auto max-w-[1160px] px-4 py-20 sm:px-6">
      <h2 id="testimonials-title" className="mb-10 text-center font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
        {t("title")}
      </h2>
      <ul className="grid gap-4 md:grid-cols-3">
        {TESTIMONIALS.map((q) => (
          <li key={q.name} className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
            <blockquote className="text-lg">{q.quote}</blockquote>
            <p className="mt-4 font-display font-bold">{q.name}</p>
            <p className="text-sm text-muted-foreground">{q.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The last push: a blue block with the owl and one button. */
export async function FinalCta({ startHref }: { startHref: string }) {
  const t = await getTranslations("landing.final");
  return (
    <section className="mx-auto max-w-[1160px] px-4 py-20 sm:px-6 lg:py-28">
      <div className="relative overflow-hidden rounded-[32px] bg-primary px-6 py-12 text-primary-foreground shadow-[0_6px_0_var(--primary-edge)] sm:px-12 sm:py-14">
        <span aria-hidden className="absolute -top-24 -right-16 size-72 rounded-full bg-white/10" />
        <span aria-hidden className="absolute -bottom-28 left-1/3 size-64 rounded-full bg-white/[0.07]" />
        <div className="relative flex flex-col items-center gap-6 text-center md:flex-row md:text-start">
          <Owl pose="correct" className="w-28 sm:w-32" />
          <h2 className="flex-1 font-display text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{t("title")}</h2>
          <Link
            href={startHref}
            className="inline-flex h-13 items-center justify-center rounded-2xl bg-white px-8 font-display text-base font-extrabold text-[#1d4ed8] shadow-[0_4px_0_rgb(15_23_42/0.25)] transition-transform hover:brightness-[0.98] active:translate-y-[2px] active:shadow-[0_2px_0_rgb(15_23_42/0.25)]"
          >
            {t("cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
