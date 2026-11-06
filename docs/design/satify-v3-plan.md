# Satify v3: design and build plan

Status: plan, not built yet (except the palette tokens).
Source: the v3 brief (palette, blue fox, infinity ribbon, guided tour,
dashboard, ten platform pages, unique features).
Method:
- `ui-ux-pro-max` for patterns and rules
- `design-system` for the token architecture
- `frontend-design` for the visual direction
- `planning-and-task-breakdown` for the tasks
- Apple's Human Interface Guidelines (clarity, deference, depth) as the
  overall reference

## 0. What the skills returned, and what we kept

- **Design-system generator, two runs.**
  - "education test prep" matched a children's app (claymorphism, Baloo
    and Comic Neue). Rejected: the brief says not childish.
  - "premium productivity SaaS" matched luxury fashion (Cormorant, black and
    gold). Rejected.
  - Kept only the parts that fit: the scroll-triggered storytelling
    pattern, and liquid glass for navigation chrome only.
  - The brief's palette and the current fonts stay.
- **Landing domain.** The "Product Demo + Features" pattern. Each demo has
  visible play/pause, pauses when off screen, never autoplays under reduced
  motion, and has a static final state.
- **Chart domain.** Score trend is a line chart only with 4 or more points;
  below that, a stat card. Series differ by line style, not colour alone.
  Every chart has a table view.
- **UX domain.**
  - Never use colour alone (always icon or text too).
  - Headings in order.
  - A focus ring at least 2px with 3:1 contrast.
- **Token architecture.** Three layers: primitive, then semantic, then
  component. Components never use raw hex values.

## 1. Direction

**One sentence:** a calm, precise study tool with one warm character.

| We are | We are not |
|---|---|
| Apple-level detail: alignment, spacing, crisp type | Minimal to the point of empty |
| Linear-level hierarchy: one primary action, quiet secondary UI | A generic SaaS card grid |
| Real product UI as the main visual | Stock illustration, floating blobs, glow |
| One mascot, used sparingly | Gamified (hearts, gems, leagues, confetti everywhere) |
| Motion that explains something | Motion that decorates idle screens |

**Where the boldness goes:** the hero (ribbon, fox and the live dashboard)
and the feature tour. Everything else is quiet.

**Study screens rule:** practice, mock tests and focus sessions have no
mascot, no ambient motion, no decoration and no marketing copy.

**Copy rule:** no text that explains the obvious. Labels are nouns, and
buttons are verbs.

## 2. Tokens

### 2.1 Primitives

```
navy-950 #0B1D28   navy-900 #102D40   navy-800 #163B52   navy-700 #1F4152
cyan-700 #06748D   cyan-600 #087F9B   cyan-500 #0E8BA3   cyan-400 #20B9D0
aqua-300 #75DCE7   ice-100  #E4F7FA   cloud-50 #F5F9FC   white    #FFFFFF
slate-500 #4A6474  slate-300 #9DB9C6  line-200 #D3E5EC
green-600 #16A34A  red-600 #DC2626  violet-600 #7C3AED  amber-500 #F59E0B
```

### 2.2 Semantic (light / dark)

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | cloud-50 | navy-950 | Page |
| `surface` | white | `#12293A` | Cards |
| `surface-2` | `#EEF6F9` | `#183447` | Wells, inputs, tracks |
| `fg` | navy-900 | ice-100 | Text |
| `fg-muted` | slate-500 | slate-300 | Secondary text |
| `border` | line-200 | navy-700 | Hairlines |
| `primary` | cyan-700 | cyan-400 | Buttons, links, active nav |
| `primary-fg` | white | navy-950 | Text on primary |
| `primary-soft` | ice-100 | `#123B48` | Selected backgrounds |
| `brand-a` / `brand-b` | cyan-600 / cyan-400 | same | Ribbon, charts, fox |
| `correct` / `wrong` / `review` | green / red / violet | lighter tints | Answer states only |
| `streak` | amber | amber | Streak only |

- The contrast check (`pnpm check:contrast`) passes for every text pair in
  both themes. It does now.
- **Gradient tokens (three only):**
  - `grad-hero`: navy-900 to cyan-600, at about 160°.
  - `grad-ribbon`: cyan-600 to cyan-400 to aqua-300.
  - `grad-ice`: ice-100 to white.

### 2.3 Type

| Style | Font | Size / line height | Weight | Tracking |
|---|---|---|---|---|
| Display XL (hero) | Plus Jakarta Sans | 64/64, 44/46 on mobile | 800 | −0.035em |
| Display L (section) | Jakarta | 44/48, 32/36 on mobile | 800 | −0.03em |
| Title (card) | Jakarta | 22/28 | 700 | −0.01em |
| Body L | Inter | 18/28 | 400 | 0 |
| Body | Inter | 16/24 | 400 | 0 |
| Label | Inter | 14/20 | 600 | 0 |
| Caption | Inter | 12/16 | 500 | +0.01em |
| Number | Inter, tabular | per context | 600–700 | 0 |
| Passage | Source Serif 4 | 18/30 | 400 | 0 |

- No all-caps eyebrow labels, and no monospace.

### 2.4 Space, shape, elevation

- **Spacing:** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
  - Sections: 128 apart on desktop, 96 on mobile.
  - Cards: 24 padding; 16 on mobile.
- **Grid:** 12 columns, 24px gutter.
  - Marketing max width 1160px; app content max width 1200px.
  - Sidebar 248px.
- **Radius:** chip 10, input 12, button 14, card 20, panel 28, hero 36.
- **Elevation:**
  - e0: border only.
  - e1 (card): border plus `0 1px 2px` at 5% and `0 12px 32px -16px` at
    12%, both navy.
  - e2 (popover): e1 plus `0 24px 60px -24px` at 25%.
  - Dark mode: no shadow, a lighter surface and a 6% white top hairline.
- **Glass:** only for the sticky top bar and the mobile tab bar
  (`backdrop-blur(20px)`, 80% background).

### 2.5 Components (third layer)

- Button: primary, secondary, ghost and destructive; sizes 36, 44 and 52.
- Card and stat tile.
- Segmented control (with the liquid highlight).
- Tabs, chips and badges.
- Input, select and slider.
- Ring (progress), bar and sparkline.
- Toast, sheet, popover and dialog.
- Skeleton and empty state.
- Fox, ribbon and marquee.

Each gets its own tokens: `--btn-*`, `--card-*`, and so on.

## 3. Motion

| Use | Duration | Curve |
|---|---|---|
| Hover, press | 120–160ms | ease-out; press scales to 0.98 |
| Enter (fade + 8px rise) | 260ms | spring 300/30 |
| Exit | 180ms | ease-in |
| List stagger | 50ms per item, at most 8 | — |
| Navigation indicator | spring 340/24 | the existing liquid highlight |
| Charts (draw, grow) | 700–900ms | ease-out, once, when in view |
| Page transition | 220ms | fade + 6px |
| Demo step hold | at least 2.5s per state | — |

- **Reduced motion:** a 150ms fade only. No loops, no marquee, no ribbon
  travel, no mascot idle. Demos show their final state.
- **During study:** nothing moves except the timer and direct feedback to
  the student's own actions.

## 4. Signature elements

### 4.1 The blue fox

- **Base art:** the fox on concept sheet 2, the second row.
- **Changes from the concept:**
  - Recoloured to the brand: body cyan-600, shade cyan-700, light aqua-300,
    chest and muzzle white, inner ears ice-100, eyes navy-900.
  - No outlines.
  - Slightly larger head-to-body ratio, for small sizes.
  - The tail tip is aqua; this is the signature shape.
- **Poses:** sit (default), happy (eyes closed), think (head tilted),
  cheer (tail up), sleep (curled), peek (from behind an edge).
- **Idle motion:** breathes 2% over 3.2s; blinks every 4–6s, randomised;
  tail sways ±6° over 4s; one ear twitches every 8–12s.
- **Sizes:** avatar 32, empty states 120, hero 220.
- **Where it appears:** hero, final call to action, empty states, the
  comeback screen, the end of a mock test, sign-in.
- **Limits:** at most one fox on screen, never during a question, never
  behind text.
- **Art quality:** drawn in code, it will be good but not illustrator
  level. The component takes swappable art, so a designer's SVG can
  replace it later without touching any page. The owl is retired.

### 4.2 Infinity ribbon

- One lemniscate path, 2–6px stroke with `grad-ribbon`, rounded ends.
- **Meaning:** practise, then review, then improve, then repeat.
- **Uses:**
  - Hero background: large, 14% opacity, a 40s drift.
  - "How it works" spine: draws as you scroll.
  - Pricing divider.
  - Loading mark: a small ribbon that draws itself.
- **Motion:** draws once; afterwards a 20% light travels along it every
  8s. Static with reduced motion.
- **Replaces** the v2 crossing text bands.

### 4.3 Coverage marquee

- We have no partner logos we're allowed to show, and the brief forbids
  fake partnerships. So the marquee is a set of "what's covered"
  monochrome marks, each a small icon plus a word:
  - Algebra, Advanced Math, Problem Solving, Geometry & Trig
  - Information & Ideas, Craft & Structure, Expression, Conventions
  - Desmos, Bluebook timing
- One row, 70s per loop, faded at both edges, pauses on hover.
- The `UNIVERSITY_LOGOS` slot stays empty until real logos with
  permission exist.

### 4.4 Patterns

- Fine dot grid (24px, 5% opacity) and contour lines (1px, 6%) in brand
  sections only.
- At most one gradient field per page, never behind body text.

## 5. Information architecture

```
Public: Home · Features · How it works · SAT prep · Pricing · About · Sign in · Create account
        (SAT prep also hosts the score calculator)
App:    Dashboard
        Study    → Study plan · Focus sessions
        Practice → Practice · Mock tests · Mistake notebook · Vocabulary
        Insights → Analytics · Topic progress · Recommendations · Study history · Weekly report
        Account  → Settings · Billing · Help
```

- **Desktop:** a 248px sidebar grouped as above, and a top bar with the
  exam countdown, ⌘K search, streak and avatar.
- **Mobile tabs (5):** Home, Plan, Practice, Insights, Me. Everything else
  is in "Me" or reached from the dashboard.

## 6. Public pages

### 6.1 Home: a guided product tour

```
┌ Nav (frosted on scroll) ───────────────────────────────── Sign in [Start free] ┐
│                                                                                │
│  Your SAT, planned            ┌────────── live dashboard preview ──────────┐   │
│  and proven.                  │ 1340 ▲40   Target 1450   6h 20m this week  │   │
│  One line of value.           │ ┌ Recommended next ───────────┐  ╱‾‾╲_╱‾  │   │
│  [Start free] [See how]       │ │ Inferences · 12 questions   │  chart    │   │
│  ✓ Free to start  ✓ Desmos    │ └─────────────────────────────┘           │   │
│      ∞ ribbon behind ─────────└──────────────── fox sits on edge ─────────┘   │
├ Coverage marquee ──────────────────────────────────────────────────────────────┤
│ Feature 1  text │ preview      (alternating sides, one per section)            │
│ preview │ Feature 2  text                                                      │
│ ... ×6                                                                         │
├ How it works: 4 steps on the ribbon spine ─────────────────────────────────────┤
├ Facts strip: 30 skills · 8 domains · real timing · Desmos ──────────────────────┤
├ Pricing (UZS/USD) ─────────────────────────────────────────────────────────────┤
├ FAQ ───────────────────────────────────────────────────────────────────────────┤
└ Final CTA: navy panel, ribbon, sleeping fox wakes on hover ────────────────────┘
```

**Hero preview sequence.** About 14s per loop, starting only when visible,
with a pause control.

1. The score tiles count up.
2. The recommendation card slides in.
3. The chart line draws.
4. The tabs switch to Math and the bars grow.
5. Hold, then crossfade back.

Everything is labelled "Sample". Under reduced motion it shows state 4,
static.

**Feature tour.** Each section has a 5-column text block and a 7-column
preview, alternating sides. Each preview starts when it is 40% visible and
has play/pause.

| # | Feature | Sequence | One interaction |
|---|---|---|---|
| 1 | Study plan | The week grid fades in; 5 tasks drop onto days; Tue's task gets checked; the week progress ring fills | Drag a task to another day |
| 2 | Practice | The question loads; the cursor picks B; the check turns green; the 3-step explanation unfolds | Toggle Math/R&W; pick an answer |
| 3 | Mock tests | The Bluebook header timer counts; the navigator fills 1–12; the results card flips (R&W 680, Math 690) | Open the navigator |
| 4 | Focus sessions | The ring timer starts (25:00), ticks fast in the demo, completes; the summary slides up (25 min, 18 questions) | Start or pause |
| 5 | Mistake notebook | A wrong answer is saved; the chip "Misread" is applied; it drops into "Review Thu" | Change the tag |
| 6 | Analytics | The score line draws; 8 topic bars grow; the insight "Rushed on hard Math (−34s)" appears | Switch tabs |

- **Section copy:** a title of 3–6 words, and one line of at most 14 words.
- **Mobile:** the preview sits above the text, and sequences are shortened.

### 6.2 Other public pages

- **Features.** A hero line, a sticky table of contents on the left, and
  the tour previews at full width. Below them, cards for Error patterns,
  Question remix, Progress forecast, Weekly report, Confidence tracking,
  Exam-day rehearsal and Comeback, each with a mini preview.
- **How it works.** The ribbon spine at full length:
  - Diagnose: short check, then a score band.
  - Plan: the week fills from the test date and target.
  - Practise: daily, adaptive.
  - Review: the notebook and spaced review.
  - Rehearse: exam-day rehearsal.

  Each step has a screenshot-quality preview.
- **SAT prep.**
  - A Digital SAT structure diagram (2 sections, 2 modules each, the
    adaptive arrow).
  - Timing and question counts table.
  - How scoring works.
  - The embedded score calculator.
  - Links to the official College Board resources.
- **Pricing.** The current page, restyled. The tiers stay as configured.
- **About.**
  - The mission, in one paragraph.
  - How questions are written and checked.
  - Team: a clearly marked placeholder.
  - Contact.
- **Sign in / Create account.**
  - Left: the existing auth form (email code, Google, Telegram).
  - Right: a navy panel with the ribbon, the fox in its peek pose, and one
    rotating tip.
  - On mobile, only the form.

## 7. App pages

### 7.1 Dashboard (8 sections)

```
┌ Welcome, Dilnoza · Tue 5 Nov ─────────────── 31 days to SAT ─ [Start session] ┐
├──────────────┬──────────────┬──────────────┬──────────────────────────────────┤
│ Est. 1340 ▲40│ Target 1450  │ 6h 20m /8h   │  Recommended next                │
│  sparkline   │  gap 110     │  this week   │  Inferences · 12 q · ~15 min     │
├──────────────┴──────────────┴──────────────┤  why: weakest R&W skill  [Start] │
│ Score progress (line, forecast band, labelled Estimate)  │ Weekly goal ring   │
├──────────────────────────────┬─────────────┴──────────────────────────────────┤
│ Math vs R&W (accuracy, s/q)  │ Topic performance: 8 domain bars → drill        │
├──────────────────────────────┴────────────────────────────────────────────────┤
│ Recent activity (5 rows)                                                       │
└────────────────────────────────────────────────────────────────────────────────┘
```

- **Mobile order:** welcome, recommended, score strip, goal, chart, topics,
  Math vs R&W, activity.
- **New student:** sections 2, 5 and 6 are replaced by one "Find your
  starting score" card (diagnostic, or enter an official score).
- **Fewer than 4 scores:** a stat card instead of the line chart (per the
  chart rule above).

### 7.2 Platform pages

| Page | Layout | Key interactions | Data |
|---|---|---|---|
| Study plan | Week view (default) and month view; goal bar at the top | Drag a task to reschedule; "Adapt my plan"; lock days | `StudyPlan` exists. **New:** a reschedule action and locked days |
| Focus sessions | Centre ring timer; modes 25/5, 50/10, custom; optional ambient sound; summary | Start, pause, skip break; link a session to a drill | **New:** `FocusSession` table; ambient audio files |
| Practice | Filter bar (section, domain, skill, difficulty); lesson and test modes | "Practise similar" (Question remix) | Exists |
| Mock tests | List with status; Bluebook runner; results with module breakdown | Exam-day rehearsal toggle | Exists; rehearsal is new UI |
| Mistake notebook | Due-today hero; filters; cards with your answer, the correct answer, a note and tags | Tag; note; schedule; practise similar | `ReviewItem` + `QuestionNote` exist. **New:** tags |
| Analytics | Tabs: Overview, Math, R&W, Timing; every chart has a table view | Range selector | Exists |
| Topic progress | 30 skills grouped by domain; mastery bar and a recommended drill | Start drill | Exists |
| Recommendations | A ranked list of 5, each with a reason and expected time | Start, dismiss | **New:** ranking logic over existing data |
| Study history | Timeline, filters by type | Open attempt | Exists |
| Weekly report | Week summary, comparison with last week, focus for next week | Share, email toggle | **New:** page + optional email job |
| Settings / Help | Grouped cards; Help is a searchable FAQ and contact | — | Help is new |
| Vocabulary | The current deck (kept) | — | Exists |

### 7.3 Unique features

| Feature | Logic | Where it shows | Status |
|---|---|---|---|
| Error patterns | Group wrong answers by skill × difficulty × time: rushed (<40% of average time), stuck (>200%), misread (correct elsewhere in the same skill) | Notebook, Analytics, Weekly report | Derived from `Response` |
| Question remix | Same skill and difficulty, unseen first | Practice, Notebook | Drill builder exists |
| Progress forecast | Least squares on the last 4 or more scores, projected to test day, with a ±band; always labelled "Estimate" | Dashboard chart | Needs at least 4 scores |
| Weekly report | Minutes, questions, accuracy change, top error pattern, next focus | New page; Monday email (opt-in) | New |
| Confidence tracking | Optional 1–3 after checking; a calibration chart of confidence against correctness | Practice (opt-in), Analytics | **New:** `Response.confidence` |
| Exam-day rehearsal | A full mock at the real test time, with a checklist (ID, calculator, break), strict mode | Mock tests | New UI |
| Adaptive plan | Weekly reweighting of skills by accuracy and time to the test | Study plan | Extends coach |
| Comeback | After 3 or more days away: the sleeping fox wakes, "Welcome back", a 10-question warm-up; the streak is quietly reset with no guilt copy | Dashboard (one-time card) | New |

## 8. States

- **Loading:** skeletons that match the layout; full-page loads show the
  ribbon mark.
- **Empty:** the fox in a fitting pose, one sentence and one button.
- **Error:** a plain message, Retry, and a contact link. No fox.
- **Success:** a toast. Confetti only when a mock test is finished.
- **Offline:** the existing autosave banner.

## 9. Accessibility and quality gates

- AA contrast (checked by script).
- Focus ring 2px plus a 2px offset.
- Full keyboard support for the runner, calendar and timer.
- Headings in order; charts have tables.
- Reduced motion everywhere.
- Touch targets at least 44px.
- No horizontal scroll from 360px up.
- **Performance:**
  - Home on mobile scores 90 or more in Lighthouse.
  - Demos lazy-mount when near the viewport and pause when off screen.
  - The fox and ribbon are inline SVG; no heavy 3D library.
  - The 3D look comes from layered SVG and CSS, plus at most one optimised
    WebP render in the hero.
- **Before every merge:**
  - typecheck, lint, the contrast check, unit tests and the build;
  - screenshots in light and dark on desktop and mobile;
  - the e2e specs that touch the changed pages.

## 10. Tasks (vertical slices)

Each task ends with the quality gates in §9 and a commit.

1. **Tokens.** Primitive, semantic and component layers in `globals.css`;
   no hex values in components.
   - Acceptance: the contrast check passes, and screenshots match §2.
2. **Fox component.** Six poses, idle motion, reduced motion, swappable
   art.
   - Acceptance: a preview page; no layout shift; it reads at 32px.
3. **Ribbon and marquee.** Ribbon draw, light travel and loading mark;
   coverage marquee.
   - Acceptance: everything is static under reduced motion.
4. **Home hero.** Copy, call-to-action buttons, the dashboard preview
   sequence with pause, the fox and the ribbon.
   - Acceptance: the sequence runs only while visible; the final state
     shows under reduced motion.
5. **Feature tour.** All 6 sections, each with its sequence and one
   interaction, labelled Sample.
   - Acceptance: play/pause on each; works on mobile.
6. **Home rest.** How it works, facts, pricing, FAQ and the final call to
   action.
   - Acceptance: Lighthouse mobile 90+.
7. **Public pages.** Features, How it works, SAT prep, About, auth.
8. **App shell.** The new IA, sidebar groups, top bar and mobile tabs.
   - Acceptance: e2e navigation specs updated and passing.
9. **Dashboard.** 8 sections, new-student state, mobile order.
10. **Study plan and focus sessions.** Rescheduling; the `FocusSession`
    migration, timer and summary.
11. **Notebook upgrades.** Tags, error patterns, practise similar.
12. **Insights.** Analytics restyle, topic progress, recommendations,
    history, weekly report.
13. **Optional features.** Confidence tracking, exam-day rehearsal,
    adaptive plan, comeback.
14. **Polish pass.** States, accessibility audit, performance, cleanup of
    the old owl code.

## 11. Risks and open questions

1. **Fox art quality.** Drawn in code is good but not illustrator level.
   A designer's SVG can replace it later without code changes.
2. **"3D illustrations."** Real 3D rendering is heavy. The plan uses
   layered SVG with depth shading, plus at most one pre-rendered image.
3. **New database tables** (`FocusSession`, `Response.confidence`, tags)
   mean migrations on the production database. They are additive only.
4. **The current Path roadmap** becomes "Topic progress" plus the
   dashboard, so the roadmap visual is retired. Say if you want to keep
   it.
5. **Logo marquee:** coverage marks only, until real logos with
   permission exist.
6. **Dark mode:** kept, and tuned to navy rather than black.

## 12. Illustration style (added): modern 2D, subtle paper-cut

- **Shapes:** flat vector, bold silhouettes, rounded geometry, clean ink
  outlines. No 3D clay, no realistic rendering, no comic effects, no heavy
  gradients.
- **Fixed rules** (`components/illustration/kit.tsx`):
  - One ink weight: 2.5 units in a 400×300 scene.
  - Radii 6, 12, 20.
  - One paper-cut lift: a crisp 3px drop shadow.
  - One faint grain, applied only to the paper cutout.
  - Colour only from the `--ill-*` tokens, so a palette change carries
    through.
- **Depth:** 2–3 layers per scene: back cutout, main object, front accent.
  Layers slide in on view; one element per scene floats gently. Everything
  is still under reduced motion.
- **Scenes:** Study plan, Practice, Mock test, Focus
  (`components/illustration/scenes.tsx`).
- **Decoration:** quarter circles, wavy strips and dotted arcs
  (`components/illustration/cutouts.tsx`), in four arrangements so
  neighbouring panels differ. Used in panel corners and on section edges
  only.
- **Where:** landing feature sections, page headers and empty states. Never
  inside dashboards, practice, tests or focus sessions.
- **Mascot:** the spirit is redrawn in the same style (same ink, radii,
  lift and grain). Parked until the rest is built.
