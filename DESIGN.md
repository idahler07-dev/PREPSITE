# Satify design system

Satify is calm, spacious and friendly: mostly white and neutral, cobalt for actions and data, and Pip the highlighter for personality. This file is the source of truth. The owner-only page **/manage/design** shows every token, component and Pip pose in both themes.

Tagline: **Your SAT score, *planned* and proven.** (`brand.tagline` in `messages/en.json`).

## Colors

All colors are CSS variables in `src/app/globals.css`, mapped to Tailwind (`bg-primary`, `text-muted-foreground`, …). **Never hardcode a color** in a component. `pnpm check:contrast` (also run in CI) checks every text and control pair against WCAG AA in both themes.

| Token | Light | Dark | Use |
|---|---|---|---|
| `background` | #FFFFFF | #0A0D18 | page |
| `section-tint` | #F4F6FB | #0F1324 | alternate landing sections |
| `surface` / `surface-2` | #FFFFFF / #F1F3F8 | #131830 / #1A2040 | cards / wells, hovers |
| `foreground` / `muted-foreground` | #0E1222 / #5A6178 | #EEF0FA / #9AA0BC | text |
| `border` / `input` | #E5E8F0 / #7E86A0 | #262C4A / #5F688E | dividers / control borders (3:1) |
| `primary` (cobalt) | #2747F5, hover #1C36D1, soft #E8ECFF | #6F86FF, hover #8C9EFF, soft #1C2452 | actions, links, data, selected answers |
| `accent` (coral) | #FF6B4A, soft #FFEDE7, ink #CF2600 | #FF8A6E, soft #3A1E17 | **upgrade CTAs and Pip's accents only** |
| `highlight` (lilac) | #B7A6FF | #9C88FF | `<hl>` underline and gradients only |
| `correct` (mint) | #12B886, soft #E0F7EF, ink #0C7B5A | #3DD6A3, soft #0F3329 | right answers (review only) |
| `wrong` / `danger` | #E5484D, soft #FDE8E8, ink #C8191F | #FF6B70 | wrong answers (review only), errors |
| `flagged` (amber) | #F2A20C, ink #946307 | #FFC145 | flagged questions |

AA adjustments: in light mode, coral, mint, amber and red are too light for text on white. They're used as **fills with dark text** (`text-on-fill`) and for graphics, and each has an **-ink** shade of the same hue for text and icons. White text appears only on cobalt and the red ink. In dark mode, filled controls use dark text.

Pip has its own tokens (`--mascot-body`, `--mascot-light`, `--mascot-dark`, `--mascot-cap`, `--mascot-cap-light`, `--mascot-cap-dark`, `--mascot-accent`, `--mascot-eye`, `--mascot-ink`) so it looks the same in both themes, a touch brighter in dark.

## Typography

One system, three families (loaded with `next/font`, Latin + Latin Extended, `display: swap`):

- **Geist** 400/500/600/700: everything (UI, headings, body).
- **Instrument Serif** italic: *only* the one emphasized word in marketing headlines.
- **Geist Mono** with tabular figures: scores, timers, stats (`font-mono`, `<time>`, `[data-numeric]`).

| Token | Size | Line height | Tracking |
|---|---|---|---|
| `text-hero` | 4rem | 1.05 | -0.03em |
| `text-section` | 3rem | 1.08 | -0.03em |
| `text-h2` | 2rem | 1.1 | -0.03em |
| `text-h3` | 1.375rem | 1.2 | -0.02em |
| `text-lead` | 1.125rem | 1.6 | — |
| `text-body` | 1rem | 1.6 | — |
| `text-small` | 0.875rem | 1.6 | — |
| `text-label` | 0.75rem | 1.4 | — |

Headlines are weight 600. Keep paragraphs to about 65 characters (`max-w-[60ch]`–`[65ch]`). Never set text smaller than 14px on phones, except labels.

### Emphasis rules

Emphasis is written as tags in `en.json` and rendered with `t.rich(key, emphasis)` (`src/components/motion/emphasis-tags.tsx`):

- `<i>word</i>`: Instrument Serif italic in cobalt. *"Practice **smarter**"*.
- `<hl>word</hl>`: bold with a hand-drawn lilac underline that draws in on scroll. "From 1200 to **1500**".
- `<b>word</b>`: bold, for key numbers ("**1460** estimated score").

At most **one emphasis per headline**. The brand tagline is the only exception: it pairs *planned* with **proven**. Never use emphasis in the test interface: questions and passages stay plain and exam-like.

## Spacing and layout

- 8px grid. Content max width **1200px**; side padding **24px** on mobile, **48px** on desktop (`section-inner`, `Container`).
- Landing sections are **160px** apart on desktop and **96px** on mobile (`.section`), alternating `background` and `section-tint` instead of using lines.
- Card padding: **32px** desktop, **20px** mobile. Bento grids: at most 3 cards per row, 24px gaps, one purpose per card.
- Radius: **20px** large cards (`rounded-xl`, `rounded-[20px]`), **14px** cards (`rounded-lg`), **12px** buttons and inputs, **999px** pills.
- Elevation: soft layered shadows in light mode (a tight one plus a large faint one); in dark mode, borders with a faint inner top highlight.
- Tap targets are at least 44px.

### Landing section pattern

One idea per section: a pill label with a colored icon (`SectionPill`), a big headline on the left and a short paragraph on the right (`SectionHead`), one CTA, then a large product mockup or bento. Vary the composition every 2–3 sections: centered head + path, full-width mockup, two columns with Pip and a speech bubble, tilted mockup with floating cards, bento. Mockups are **real components with sample data** (`src/components/marketing/mockups.tsx`), never screenshots. **No invented statistics, testimonials or user counts.** Real figures need `site.config.ts › publicStats` thresholds.

## Components

| Component | File | Notes |
|---|---|---|
| Button | `ui/button.tsx` | `default` (cobalt), `secondary` (outline), `ghost`, `accent` (coral, upgrade/pricing only), `destructive`, `link`. Hover lifts 2px, press scales 0.97. |
| Card | `ui/card.tsx` | 14px radius; `interactive` lifts on hover. |
| SpotlightCard | `motion/interactive-card.tsx` | Bento card with a cursor spotlight (desktop); `tilt` only on landing feature cards. |
| Tabs | `ui/tabs.tsx` | Active pill slides between options (`layoutId`). |
| PageHeader | `layout/page-header.tsx` | Title, one-line description, primary action on the right. |
| EmptyState | `layout/empty-state.tsx` | Always an Pip pose, one sentence, one action. |
| ConfirmDialog | `ui/confirm-dialog.tsx` | For destructive actions. |
| Skeleton | `ui/skeleton.tsx` | Shimmer, never a spinner for content. |
| SkillMap / TrendChart | `learning/` | Tiles shaded by mastery; line chart that draws in. |
| Odometer | `motion/odometer.tsx` | Numbers roll up from 0 and to new values. |
| Command palette | `layout/command-palette.tsx` | Ctrl/Cmd + K, glass. |
| AppShell | `layout/app-shell.tsx` | Sidebar (collapses, remembered in a cookie); bottom tab bar + "More" sheet on phones. |

Glass (`.glass`) is only for the sticky top bars, the command palette and floating panels (calculator, reference sheet).

## Pip, the mascot

`<Mascot pose="..." />` (`src/components/mascot/mascot.tsx`) is Pip, an original lilac highlighter with a cobalt cap: glossy barrel with a specular stripe and ambient occlusion, a white label band carrying the logo, a pocket clip, a chisel nib, small arms and a simple face (dark oval eyes with highlights, coral cheeks). Pip marks what matters and glows when you get it right (the `cheer` pose has a soft lilac halo). All shading is SVG gradients, no filters or raster images. Replace the artwork **inside that one file** without touching anything else.

| Pose | Where |
|---|---|
| `wave` | hero, dashboard greeting, OG image |
| `think` | AI tutor while answering ("Ask Pip"), loading, estimate empty state |
| `cheer` | correct answer pop-in (drills), finished test celebration, final CTA |
| `focus` | tilted, highlighting a line (study moments) |
| `sleepy` | streak reminder when the streak has lapsed |
| `point` | onboarding tips, study plan bubble, "start here" empty states |
| `juggle` | holding many tools at once (hero variants, error page) |
| `confused` | 404 page |

Pip is personality, not decoration: use Pip in the hero, empty states, onboarding, the tutor, celebrations and reminders. **Never inside test questions.** Pip blinks, poses cross-fade, raised arms wave or bob, and reacts on hover in the hero.

## Logo

The mark is the **Rising S**: the S of Satify finishing as an upward stroke with an arrow tip (progress), in a cobalt squircle with a 28% corner radius and smoothed corners (`src/lib/brand-mark.ts`). Two renderings:

- **Flat** (16–48px, `<BrandMark>`): solid squircle, the S in one color with slightly heavier strokes. Follows the theme.
- **Gloss** (64px and up, `<BrandMarkGloss>`): gradient squircle with an inner glow, darker lower edge and rim light; the S is a soft 3D ribbon with a highlight and ambient occlusion. Brighter edges in dark mode.

Wordmark: Geist 700, tracking −0.035em. Mark height = cap height (0.71em) × 1.3; gap 0.35em (`components/layout/logo.tsx`).

Three concepts were drawn (Rising S, Steps, Bubble) and are compared at 16/32/64/256px on `/manage/design`. **Rising S** won: it carries the name and the promise (it rises) and stays crisp from a 16px favicon to a 256px icon; Steps reads as a signal icon and Bubble turns into a plain dot at 16px.

`pnpm brand` writes everything to `public/brand/` (plus `public/favicon.ico`): `logo(-dark).svg` and `logo-flat(-dark).svg`, `mark.svg` (theme-aware favicon), `mark-small(-dark).svg`, `mark-gloss(-dark).svg`, `favicon-16/32/48.png`, `apple-touch-icon.png`, `icon-192/512.png`, `icon-maskable-512.png`, `mark-1024.png`, `logo-email.png` and the 1200×630 `og.png`.

## Motion

Tokens in `src/lib/motion.ts`; use them everywhere:

- `spring.soft` = visual duration 350ms, bounce 0.1: page transitions, reveals, fills, sheets.
- `spring.snappy` = 250ms, bounce 0.1: pills, sidebar, toggles, docked panels.
- `spring.bouncy` = 400ms, bounce 0.35: **celebrations only**.
- `ease.out` = [0.22, 1, 0.36, 1]; `fade` = 150ms (what reduced motion gets).
- **Nothing takes longer than 400ms.** Springs are set by visual duration, not stiffness, so don't override `stiffness`/`damping`. The only exceptions are ambient loops (floating hero cards, mesh gradient, Pip's idle float), which stop with reduced motion.

Rules:

- Animate only **transform, opacity and filter**. No layout thrashing, no layout shift. Use `layout` / `layoutId` for size changes and shared elements.
- Page transitions: fade + 12px rise + blur 4px→0. Sections reveal once on scroll (fade, rise, scale 0.98→1, staggered).
- Hero: words rise in one by one (40ms), the emphasized word last, then its underline draws. Floating mini-cards bob on a 6s loop and drift slightly on scroll.
- Answers: the selection fills from the click point. After "Check answer": the picked card turns green with a check that draws itself, or red with a cross that draws itself (the correct card turns green); a slim result strip springs in ("Correct · 0:42" / "Incorrect · Correct answer: B"); the neutral explanation card then expands. **No shaking, no red box.** In drills Pip pops in cheering on a correct answer.
- Celebrations last at most 1 second, and never happen during a test. The test interface only animates selection, feedback and panels.
- `useLiteMotion()` turns off tilt, spotlight, parallax, cursor-reactive gradients and heavy blur on small, touch or weak devices. `prefers-reduced-motion` keeps only short fades (Pip's idle loops stop too).

## Product surfaces

**Question page** (`components/test/`). Top bar: Exit (or "Back to bank") and title · centered timer · tools. Tool icons have hover/focus labels with their shortcut key; on phones they collapse into a **Tools** menu. The question sits in a card about 680px wide on the tinted background: a header row with the number, a "Section · Skill" chip, a difficulty chip with a colored dot (green/amber/red; practice only, never in practice tests), and Mark for review. Stem 1.0625em, line height 1.65, KaTeX at 1.08em; everything scales with the zoom control. Choices are full-width cards with A–D badges and a cross-out button each (Shift + letter). Typed answers get a large box, a live preview (fractions stacked) and the rules folded under "Answer format". Phones: bottom bar Back · navigator · Next with safe-area padding; the navigator is a bottom sheet (popover on desktop) with current / answered / unanswered / flagged tiles. **Question IDs never appear here**, only in the question bank.

**Desmos** (`components/test/calculator.tsx`). Official graphing and scientific calculators, one instance per session. Desktop: docked panel (left by default, can be dragged to the right), resizable from its inner edge; the question reflows. Phones: full-height bottom sheet. See README › Desmos calculator for keys, terms and the security policy.

**Reference sheet.** Our own line diagrams (stroke `foreground/70`, fill `primary-soft`, cobalt for the measured line, italic serif labels) beside each formula. Side panel on desktop, bottom sheet on phones.

**Question bank** (`/question-bank`). Filters in the URL; section tabs, domain and skill chips, difficulty chips with counts, status chips, search and sort. Rows show ID (monospace, the only place students see it), skill, difficulty, a plain-text preview, my status and my last time. Table on desktop, cards on phones with the filters in a bottom sheet.

**Charts** (`components/learning/analytics-charts.tsx`). Plain HTML/CSS. Correct and incorrect use `--chart-correct` / `--chart-incorrect` (validated against both surfaces; incorrect also gets a hatch). Magnitude uses one cobalt ramp. Every chart has a legend when it has two series, a hover tooltip and a screen-reader table. One axis per chart.

**Navigation.** Desktop sidebar in three groups: Study (Home, Plan, Analytics, Mistakes, Vocabulary), Practice (Question bank, Drills, Mock tests, History), Account (Settings, Plan and payments, Official resources, Manage for owners); it collapses to icons. Phones: Home, Practice, Question bank, Tests, More, with a sliding pill. The demo notice is 32px and can be hidden for the session (`NEXT_PUBLIC_DEMO_BANNER`).

**States.** Every data page has a loading skeleton (`PageSkeleton`), an error state with retry (`RouteError`) and an empty state (`EmptyState`, a Pip pose + one sentence + one action). Checked at 360/390/768/1440px in both themes with no horizontal scrolling.

## Micro-details

- Keyboard shortcuts appear as key caps (`<kbd>`) in tooltips; Ctrl/Cmd + K opens the palette.
- Theme: light / dark / system with a circular View Transitions reveal (200ms fade fallback); the favicon and theme-color follow the chosen theme.
- Test-day countdown in the app top bar.
- Microcopy: short and friendly, with consistent verbs ("Start test" → "Test started").
