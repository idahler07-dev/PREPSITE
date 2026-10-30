import { getTranslations } from "next-intl/server";
import { BarChart3, CalendarDays, CircleHelp, ClipboardList, CreditCard, Library, Route } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getFeaturedQuestion } from "@/server/landing";
import { paidPlanCards } from "@/server/billing/plan-cards";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/mascot";
import { Section, SectionHead, SectionPill } from "@/components/marketing/section";
import { HowPath } from "@/components/marketing/how-path";
import { HeroHeadline } from "@/components/marketing/hero-headline";
import { LiveQuestion } from "@/components/marketing/live-question";
import { FaqList } from "@/components/marketing/faq-list";
import { PlanCards } from "@/components/billing/plan-cards";
import { Magnetic, SpotlightCard } from "@/components/motion/interactive-card";
import { Reveal, RevealItem } from "@/components/motion/reveal";
import { emphasis } from "@/components/motion/emphasis-tags";
import { CountdownMock, Floating, MockTestMockup, PacingMock, ScoreMini, SkillMapMock, StreakMini, TimerMini, TrendMock, TutorMockup, WeeklyPlanMock } from "@/components/marketing/mockups";

const FAQ_KEYS = ["official", "score", "language", "device", "mistake"] as const;

export default async function HomePage() {
  const t = await getTranslations("home");
  const f = await getTranslations("faq");
  const user = await getCurrentUser();
  const question = await getFeaturedQuestion();
  const plans = await paidPlanCards("UZS", !!user);
  const startHref = user ? "/practice" : "/login";
  const diagnosticHref = user ? "/mocks" : `/login?next=${encodeURIComponent("/mocks")}`;

  return (
    <>
      {/* 2. Hero */}
      <section className="relative overflow-hidden bg-background">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(60%_60%_at_80%_10%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_70%)]" />
        <div className="section-inner relative grid items-center gap-16 pt-16 pb-24 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pt-24 lg:pb-40">
          <div>
            <HeroHeadline raw={t.raw("title") as string} className="text-[2.75rem] leading-[1.05] font-semibold tracking-[-0.03em] sm:text-hero" />
            <p className="mt-6 max-w-[52ch] text-lead text-muted-foreground">{t("subtitle")}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Magnetic>
                <Button asChild size="lg" className="rounded-full px-7">
                  <Link href={startHref}>{t("ctaPrimary")}</Link>
                </Button>
              </Magnetic>
              <Magnetic>
                <Button asChild size="lg" variant="secondary" className="rounded-full px-7">
                  <Link href={diagnosticHref}>{t("ctaSecondary")}</Link>
                </Button>
              </Magnetic>
            </div>
            <p className="mt-4 text-small text-muted-foreground">{t("noCard")}</p>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:me-0">
            <Mascot pose="wave" hoverReact className="absolute -top-[5.5rem] right-2 z-0 w-36 sm:-top-28 sm:right-0 sm:w-44" />
            <Floating className="-bottom-10 -left-6 sm:-left-16" delay={0.6}>
              <ScoreMini />
            </Floating>
            <Floating className="-top-14 -left-2 sm:-top-10 sm:-left-24" delay={1.8} drift={0.05}>
              <StreakMini />
            </Floating>
            <div className="relative z-10">{question ? <LiveQuestion question={question} ctaHref={startHref} /> : <TutorMockup />}</div>
          </div>
        </div>
      </section>

      {/* 3. How it works */}
      <Section id="how" tint>
        <SectionHead
          align="center"
          pill={<SectionPill icon={<Route />}>{t("how.label")}</SectionPill>}
          title={t.rich("how.title", emphasis)}
          body={t("how.body")}
        />
        <HowPath steps={(["diagnose", "plan", "practice"] as const).map((k) => ({ title: t(`how.steps.${k}.title`), body: t(`how.steps.${k}.body`) }))} />
      </Section>

      {/* 4. Question bank + Ask Pip: full-width mockup */}
      <Section id="features">
        <SectionHead
          pill={<SectionPill icon={<Library />}>{t("bank.label")}</SectionPill>}
          title={t.rich("bank.title", emphasis)}
          body={t("bank.body")}
          cta={
            <Button asChild size="lg" className="rounded-full">
              <Link href={startHref}>{t("bank.cta")}</Link>
            </Button>
          }
        />
        <Reveal>
          <RevealItem>
            <TutorMockup />
          </RevealItem>
        </Reveal>
      </Section>

      {/* 5. Study plan: two columns, Pip with a speech bubble */}
      <Section tint>
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="space-y-6">
            <SectionPill icon={<CalendarDays />} tone="accent">
              {t("plan.label")}
            </SectionPill>
            <h2 className="text-h1 font-semibold lg:text-section">{t.rich("plan.title", emphasis)}</h2>
            <p className="max-w-[55ch] text-lead text-muted-foreground">{t("plan.body")}</p>
            <div className="flex items-end gap-4 pt-2">
              <Mascot pose="point" className="w-28 shrink-0" />
              <p className="relative mb-10 rounded-2xl rounded-bl-md border bg-surface px-4 py-3 text-small shadow-md">{t("plan.bubble")}</p>
            </div>
            <Button asChild size="lg" className="rounded-full">
              <Link href={user ? "/plan" : "/login"}>{t("plan.cta")}</Link>
            </Button>
          </div>
          <Reveal className="relative grid gap-5 sm:grid-cols-[1.4fr_1fr] sm:items-start">
            <RevealItem>
              <WeeklyPlanMock />
            </RevealItem>
            <RevealItem className="sm:mt-16">
              <CountdownMock />
            </RevealItem>
          </Reveal>
        </div>
      </Section>

      {/* 6. Mock tests: tilted full mockup with a floating timer */}
      <Section>
        <SectionHead
          pill={<SectionPill icon={<ClipboardList />}>{t("mocks.label")}</SectionPill>}
          title={t.rich("mocks.title", emphasis)}
          body={t("mocks.body")}
          cta={
            <Button asChild size="lg" variant="secondary" className="rounded-full">
              <Link href={diagnosticHref}>{t("mocks.cta")}</Link>
            </Button>
          }
        />
        <div className="relative mx-auto max-w-5xl [perspective:1600px]">
          <Floating className="-top-16 right-2 sm:-top-14 sm:-right-10" delay={1}>
            <TimerMini />
          </Floating>
          <Reveal>
            <RevealItem className="lg:[transform:rotateX(6deg)]">
              <MockTestMockup />
            </RevealItem>
          </Reveal>
        </div>
      </Section>

      {/* 7. Analytics: bento */}
      <Section tint>
        <SectionHead
          align="center"
          pill={
            <SectionPill icon={<BarChart3 />} tone="correct">
              {t("analytics.label")}
            </SectionPill>
          }
          title={t.rich("analytics.title", emphasis)}
          body={t("analytics.body")}
        />
        <Reveal className="grid gap-6 lg:grid-cols-3">
          <RevealItem className="lg:col-span-2">
            <SpotlightCard className="h-full rounded-[20px] p-5 lg:p-8">
              <p className="mb-5 font-semibold">{t("analytics.skills")}</p>
              <SkillMapMock />
            </SpotlightCard>
          </RevealItem>
          <div className="grid gap-6">
            <RevealItem>
              <SpotlightCard className="rounded-[20px] p-5 lg:p-8">
                <p className="mb-3 font-semibold">{t("analytics.trend")}</p>
                <TrendMock label={t("analytics.trend")} />
              </SpotlightCard>
            </RevealItem>
            <RevealItem>
              <SpotlightCard className="rounded-[20px] p-5 lg:p-8">
                <p className="font-semibold">{t("analytics.pacing")}</p>
                <p className="mb-4 text-small text-muted-foreground">{t("analytics.pacingBody")}</p>
                <PacingMock />
              </SpotlightCard>
            </RevealItem>
          </div>
        </Reveal>
        <div className="mt-12 flex justify-center">
          <Button asChild size="lg" className="rounded-full">
            <Link href={startHref}>{t("analytics.cta")}</Link>
          </Button>
        </div>
      </Section>

      {/* 8. Pricing preview */}
      <Section>
        <SectionHead
          align="center"
          pill={
            <SectionPill icon={<CreditCard />} tone="accent">
              {t("pricing.label")}
            </SectionPill>
          }
          title={t.rich("pricing.title", emphasis)}
          body={t("pricing.subtitle")}
        />
        <PlanCards plans={plans} compact />
        <div className="mt-10 flex justify-center">
          <Button asChild variant="secondary" size="lg" className="rounded-full">
            <Link href="/pricing">{t("pricing.cta")}</Link>
          </Button>
        </div>
      </Section>

      {/* 9. FAQ: heading left, accordion right */}
      <Section tint>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div className="space-y-5">
            <SectionPill icon={<CircleHelp />}>{t("faq.label")}</SectionPill>
            <h2 className="text-h1 font-semibold lg:text-section">{t.rich("faq.title", emphasis)}</h2>
          </div>
          <FaqList items={FAQ_KEYS.map((k) => ({ q: f(`items.${k}.q`), a: f(`items.${k}.a`) }))} />
        </div>
      </Section>

      {/* 10. Final CTA */}
      <section className="section bg-background">
        <div className="section-inner">
          <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_16%,var(--surface)),color-mix(in_oklab,var(--highlight)_30%,var(--surface)))] px-6 py-16 text-center sm:px-12 lg:py-24">
            <Mascot pose="cheer" className="mx-auto mb-6 w-36" />
            <h2 className="mx-auto max-w-[18ch] text-h1 font-semibold lg:text-section">{t.rich("final.title", emphasis)}</h2>
            <p className="mx-auto mt-5 max-w-[50ch] text-lead text-muted-foreground">{t("final.body")}</p>
            <Button asChild size="lg" className="mt-8 rounded-full px-8">
              <Link href={startHref}>{t("final.cta")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
