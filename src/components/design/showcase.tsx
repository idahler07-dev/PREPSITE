"use client";
/* eslint-disable react/jsx-no-literals -- designer-facing showcase with sample labels, not user copy */

import { useState } from "react";
import { Bell, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mascot, MASCOT_POSES } from "@/components/mascot/mascot";
import { Odometer } from "@/components/motion/odometer";
import { SpringBar } from "@/components/motion/progress";
import { SpotlightCard } from "@/components/motion/interactive-card";
import { emphasis } from "@/components/motion/emphasis-tags";
import { SkillMap } from "@/components/learning/skill-map";
import { TrendChart } from "@/components/learning/trend-chart";
import { ChoiceList } from "@/components/test/choice-list";
import { EmptyStateDemo } from "./empty-state-demo";

/*
 * Design system showcase (owners only, /manage/design). Sample labels here are
 * for designers, so they're plain constants rather than translations.
 */
const TOKENS = ["background", "section-tint", "surface", "surface-2", "foreground", "muted-foreground", "border", "input", "primary", "primary-hover", "primary-soft", "accent", "accent-soft", "accent-ink", "highlight", "correct", "correct-soft", "correct-ink", "flagged", "warning-ink", "danger", "danger-soft", "danger-ink"];
const TYPE = [
  ["hero", "text-hero", "Your SAT score"],
  ["section", "text-section", "Know exactly what to practise"],
  ["h2", "text-h2", "Estimated score"],
  ["h3", "text-h3", "Today's plan"],
  ["lead", "text-lead", "A short supporting paragraph, about 65 characters per line."],
  ["body", "text-body", "Body text in Geist at 1rem with a 1.6 line height."],
  ["small", "text-small", "Small text for captions and helper lines."],
  ["label", "text-label", "LABEL · 0.75REM"],
] as const;
const CHOICES = ["11", "26", "30", "41"].map((html, i) => ({ key: "ABCD"[i]!, html }));
const SKILLS = [0.92, 0.8, 0.66, 0.5, 0.35, 0.2, null].map((m, i) => ({ key: String(i), label: `Skill ${i + 1}`, mastery: m, detail: m == null ? undefined : `${Math.round(m * 100)}%` }));
const TREND = [1180, 1220, 1210, 1290, 1340].map((value, i) => ({ label: `T${i + 1}`, value }));
const H = { tokens: "Color tokens", type: "Type scale", buttons: "Buttons", forms: "Inputs, badges, tabs", data: "Data and motion", test: "Answer choices", otto: "Otto poses", empty: "Empty state", emphasis: "Emphasis" };

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-label font-semibold tracking-wide text-muted-foreground uppercase">{title}</h2>
      {children}
    </section>
  );
}

export function Showcase() {
  const [score, setScore] = useState(1340);
  const [pick, setPick] = useState<string | null>("B");
  const [checked, setChecked] = useState(false);
  return (
    <div className="space-y-12">
      <Block title={H.tokens}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TOKENS.map((t) => (
            <li key={t} className="flex items-center gap-3">
              <span className="size-10 shrink-0 rounded-[10px] border" style={{ background: `var(--${t})` }} />
              <code className="font-mono text-label">{t}</code>
            </li>
          ))}
        </ul>
      </Block>
      <Block title={H.type}>
        <div className="space-y-3">
          {TYPE.map(([name, cls, sample]) => (
            <div key={name} className="flex items-baseline gap-4">
              <code className="w-16 shrink-0 font-mono text-label text-muted-foreground">{name}</code>
              <p className={`${cls} truncate ${name === "hero" || name === "section" || name === "h2" || name === "h3" ? "font-semibold" : ""}`}>{sample}</p>
            </div>
          ))}
        </div>
      </Block>
      <Block title={H.emphasis}>
        <p className="text-h2 font-semibold">{emphasis.i("Practice")} smarter</p>
        <p className="text-h2 font-semibold">From 1200 to {emphasis.hl("1500")}</p>
      </Block>
      <Block title={H.buttons}>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="accent">Upgrade</Button>
          <Button variant="destructive">Delete</Button>
          <Button disabled>Disabled</Button>
          <Button size="icon" aria-label="Add">
            <Plus />
          </Button>
        </div>
      </Block>
      <Block title={H.forms}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input placeholder="you@example.com" aria-label="Email" />
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="soft">Soft</Badge>
            <Badge variant="accent">Accent</Badge>
            <Badge variant="success">Correct</Badge>
            <Badge variant="warning">Flagged</Badge>
            <Badge variant="destructive">Wrong</Badge>
          </div>
          <Tabs defaultValue="a">
            <TabsList>
              <TabsTrigger value="a">Week</TabsTrigger>
              <TabsTrigger value="b">Month</TabsTrigger>
              <TabsTrigger value="c">All</TabsTrigger>
            </TabsList>
            <TabsContent value="a" className="text-small text-muted-foreground">
              Sliding pill (layoutId, spring.snappy)
            </TabsContent>
          </Tabs>
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </Block>
      <Block title={H.data}>
        <div className="grid gap-4 lg:grid-cols-3">
          <SpotlightCard className="rounded-[20px] p-6">
            <p className="text-[3rem] leading-none font-bold">
              <Odometer value={score} className="font-mono" />
            </p>
            <Button size="sm" variant="secondary" className="mt-4" onClick={() => setScore((s) => s + 20)}>
              <Bell /> +20
            </Button>
            <SpringBar value={62} label="Progress" className="mt-4" />
          </SpotlightCard>
          <SpotlightCard className="rounded-[20px] p-6">
            <TrendChart points={TREND} label="Trend" />
          </SpotlightCard>
          <SpotlightCard className="rounded-[20px] p-6">
            <SkillMap tiles={SKILLS} columns="grid-cols-3" />
          </SpotlightCard>
        </div>
      </Block>
      <Block title={H.test}>
        <div className="max-w-md space-y-3">
          <ChoiceList name="demo" choices={CHOICES} value={pick} eliminated={[]} eliminatorOn={false} correctAnswers={checked ? ["B"] : undefined} onSelect={setPick} onToggleEliminate={() => {}} />
          <Button size="sm" onClick={() => setChecked((c) => !c)}>
            {checked ? "Reset" : "Check"}
          </Button>
        </div>
      </Block>
      <Block title={H.otto}>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {MASCOT_POSES.map((p) => (
            <li key={p} className="flex flex-col items-center gap-2 rounded-[14px] border bg-surface p-4">
              <Mascot pose={p} className="w-24" hoverReact />
              <code className="font-mono text-label">{p}</code>
            </li>
          ))}
        </ul>
      </Block>
      <Block title={H.empty}>
        <EmptyStateDemo />
      </Block>
    </div>
  );
}
