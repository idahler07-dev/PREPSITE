# WilloPrep design masterplan

November 2026. This replaces the look in `satify-v3-plan.md` (its page
structure and data notes still apply). Product decisions live in
`docs/product/willoprep-strategy.md`.

## 1. The feel

Warm, soft and confident. A student should feel welcomed, then pointed at
one clear next step. The reference the owner shared sets the vibe: cream
surfaces, soft tinted cards, one illustration blending into a card,
orange for energy, teal for trust. We keep that and stay grown-up:

- **Calm first, playful second.** Big type, generous space, few things per
  screen. Playfulness comes from Willo and a handful of illustrations.
- **One hero per screen.** Each page has one focal element (Willo, a
  ring, a chart). Everything else is quiet.
- **Illustration with restraint.** At most one illustration per card, on
  at most a third of the cards on a page. Never two competing in view.
- **Not childish.** No confetti showers, no bouncing UI, no emoji as
  icons, no rainbow of colours. Motion is small and physical.

## 2. Colour

| Role | Light | Use |
|---|---|---|
| Page | `#FBF8F4` warm cream | App and landing background |
| Surface | `#FFFFFF` | Cards |
| Ink | `#102D40` navy | Text, dark buttons |
| Muted ink | `#5C6B77` | Secondary text |
| Line | `#EDE6DD` warm hairline | Borders, dividers |
| Primary (teal) | `#087F9B`, text-safe `#06748D` | Links, charts, selected states, focus ring |
| Energy (orange) | `#EE7A2F` → `#E8662A` gradient | The one primary action per view, active nav, progress |
| Orange text | `#B4501A` | Orange meaning in text (passes AA on cream) |
| Gold | `#F6C453` | Leaf, sparkles, milestones only |
| Tints | peach `#FFE9D6`, mint `#DDF4EC`, sky `#E0EEFB`, aqua `#E0F4F8` | Card backgrounds, one tint per card |
| Correct / wrong | `#1B9E77` / `#E5484D` | Answers only |

Rules: orange is for *doing* (start, continue, upgrade) and for
progress; teal is for *knowing* (data, links, selection). A screen has
one orange button. Dark mode keeps the navy family from v3 with the
same roles; tints become low-opacity washes.

## 3. Type

Plus Jakarta Sans ExtraBold for display, Inter for text.

| Style | Size / line | Use |
|---|---|---|
| Display | 54/56, −0.04em | Landing hero, dashboard greeting |
| H1 | 36/40, −0.03em | Page titles |
| H2 | 22/28, −0.02em | Card titles |
| Stat | 36/36 tabular | Big numbers |
| Body | 16/26 | Text |
| Small | 13/18 | Meta, captions (never below 12) |

One accent word per headline may take the orange gradient.

## 4. Shape, depth, space

- Radius: cards 28, inner blocks 20, inputs 14, pills full.
- Shadow: one soft warm shadow for cards
  (`0 18px 40px -20px rgb(120 70 30 / .22)`), a white 1px inner border,
  an orange glow only under orange buttons.
- Spacing on a 4px grid; card padding 24–28; 24 between cards; page
  gutter 40 desktop, 16 phone. Content max width 1180 in the app.
- Backgrounds: two very soft radial washes per page (aqua top right,
  peach bottom left) and one wave band behind the header. Nothing else.

## 5. Illustration system

Style: soft-shaded vector objects in the mascot's palette (teal body,
orange accent, cream paper, gold detail), one light from top left, a
soft ground shadow. Built as React SVG components so they stay sharp
and themeable.

**How they blend in:** the illustration sits in a card's bottom-right
corner, 10–15% cropped by the card edge, on top of a tinted "cloud"
shape of the card's own tint. Text never overlaps it; the text column
keeps 58% of the card width.

| Illustration | Meaning | Where |
|---|---|---|
| Target with arrow | Target score | Dashboard stat, onboarding goal step |
| Growth bars with leaf | Estimated score, improvement | Dashboard stat, analytics header |
| Calendar | Test day, study plan | Dashboard stat, plan header |
| Flame | Streak | Dashboard stat |
| Books with sprout | Today's plan, practice | Plan card, practice header |
| Notebook with ticks | Mistake notebook | Dashboard card, notebook header |
| Mountain flag | Goal reached, test day | Calendar corner, milestones |
| Stopwatch | Focus, timed practice | Focus header, mock tests |
| Trophy | Milestones | Milestone toast, results |

Empty states use Willo, not objects.

## 6. Icons, buttons, inputs

- **Icons:** Lucide, 2px stroke, 20px in nav and 16px inline. The active
  nav icon is orange. Icons never replace labels except in the top bar
  (with tooltips).
- **Buttons:** primary = orange gradient pill, white text, glow, 44px
  (52 on landing); secondary = white pill with warm hairline; dark =
  navy pill for neutral confirmations; ghost = text with arrow. Press
  scales to 0.97. Labels are verbs ("Start practice", "Review now").
- **Circular play button** (orange, 46px) is the "start this" control in
  lists.
- **Inputs:** 48px, white, warm hairline, 14 radius, visible label
  above; focus ring 2px teal with 2px offset.
- **Chips and tabs:** segmented pill on a cream track; the selected
  segment is white with a soft shadow.
- **Progress:** ring (orange gradient on a cream track) for "how much of
  today", bar for topic accuracy, line for score over time.

## 7. Motion

- Durations 150 / 250 / 400ms, ease `cubic-bezier(.22,1,.36,1)`; only
  transform and opacity animate.
- Entrances: cards rise 12px and fade, staggered 60ms, once.
- Numbers count up once. Rings and bars fill once.
- Hover: cards lift 2px; illustrations shift 3px toward the pointer.
- Reduced motion: everything is static and complete.

### Willo's movement (professional, not cartoonish)

Small amplitudes, slow timing, long pauses:

- Breathing always (barely visible). Head drift of ±1°, with a rare
  slow glance (every 8–14s).
- Eyes: blinks every 3–6s; pupils follow the pointer gently, otherwise
  rest. No constant darting.
- Ears: one small flick every 6–12s. Antlers follow the head with a
  soft settle. Scarf: a slow, low wave.
- No looping hops. A single small hop plays once when Willo celebrates
  (correct answer, milestone) or when the pose changes.

## 8. App layout

- **Sidebar (228px, floating white panel):** logo, then Dashboard,
  Study plan, Focus, Practice, Mock tests, Mistakes, Vocabulary,
  Analytics; Settings at the bottom above a "Go Premium" card (hidden
  for Premium users, who see their plan instead). Active item: peach
  pill, orange icon.
- **Top bar:** search pill (⌘K), then on the right the streak, a
  notifications bell and the avatar menu.
- **Phone:** five bottom tabs (Home, Plan, Practice, Insights, Me); the
  sidebar becomes a drawer; stat cards scroll horizontally.

## 9. Dashboard (what earns a place)

It answers four questions in order: what do I do today, where am I, am I
improving, what is weak.

1. **Greeting band:** "Good morning, {name}!" with the name in orange,
   one line of context (days to test or streak), Willo on the right.
2. **Four stat cards** (tinted, each with its illustration): Target
   score (target), Estimated score with change (growth), Days to test
   day (calendar), Study streak (flame). Each opens its page.
3. **Today's plan** (wide card, the hero of the page): ring "1 of 3
   done", a timeline of today's tasks (done / up next highlighted with
   an orange play button / later), time left, "View full plan". Books
   illustration in the corner.
4. **Study calendar:** this month, dots for studied and planned days,
   today in orange, test day marked with the flag.
5. **Score journey:** line chart of estimates and official scores with
   the target as a dashed orange line; range switch; table view.
6. **Focus areas:** the three weakest skills with accuracy bars and a
   "Drill" button each.
7. **Mistake notebook:** how many are due today, the most common error
   type, "Review now"; notebook illustration.

Left out on purpose: XP, leaderboards, decorative donut charts,
"key metrics" that are not about learning, a second progress chart.
New students see a single "Find your starting score" card in place of
sections 3–7's data.

## 10. Other app pages

| Page | Hero | Layout |
|---|---|---|
| Study plan | Week ring + "Adapt my plan" | Week board (7 columns, tinted session cards, drag to move), month calendar tab, a note explaining the last adaptation |
| Focus | The timer ring on a deep teal panel | Length chips, "working on" chips from today's plan, start/pause/end; history tab |
| Practice | "Continue" card for the next recommended drill | Filter bar (section, skill, difficulty), skill list with mastery bars; books illustration in the header |
| Question screen | The question | Two columns: question and choices; Willo tutor panel (Hint before answering; Explain, Teach, Challenge after). No decoration |
| Mock tests | "Start a full practice test" card with stopwatch | List of tests with status and scores. The test runner keeps its exam-faithful look (no brand decoration, no tutor) |
| Results | Score with section split | Module breakdown, weak skills, "Add to plan" |
| Mistake notebook | "6 due today" + Review now | Filter chips by error type and skill, cards with your answer vs the correct answer, note, retry |
| Vocabulary | Today's deck | Flashcard with flip, progress |
| Analytics | Score journey (large) | Tabs: Overview, Math, Reading & Writing, Timing; every chart has a table view |
| Settings / Billing | — | Grouped rows; plan card with what Premium adds |
| Onboarding | Willo, one question per step | 3 steps: target, test date, minutes a day → diagnostic or log a score |
| Empty states | Willo in a fitting pose | One sentence, one action |

## 11. Landing page (scroll story)

A sticky, cream page where each section reveals as you scroll.

1. **Hero:** "Your SAT, planned and proven." (accent word in orange),
   one line, "Start free" (orange) and "See how it works". Right side:
   the real dashboard in a tilted browser frame with Willo beside it;
   soft waves behind. On scroll the frame straightens and grows
   slightly.
2. **Trust strip:** what is true without numbers we don't have
   ("Built for the digital, adaptive SAT · Desmos built in · Free to
   start").
3. **How it works (pinned scroll):** the screen stays still while four
   steps advance with the scroll: set your goal → get your plan →
   practise with Willo → watch your score grow. The product frame on
   the right swaps screens as each step activates; a progress line
   fills on the left.
4. **Feature rows:** Study plan, Practice + Willo tutor, Mock tests,
   Mistake notebook, Analytics. Each row: text on one side, a live
   product demo on the other, sliding in from its side.
5. **Meet Willo:** the animated mascot with the four tutor modes
   (Hint, Explain, Teach, Challenge) as selectable chips that change
   Willo's pose and a sample reply.
6. **Pricing:** Free vs Premium $9.99, honest comparison.
7. **FAQ**, then a **final call to action** on a deep teal panel with
   Willo, and the footer with the College Board trademark line.

No testimonials, user counts or score-gain claims until real ones exist.

## 12. Product demo videos (last)

After the pages are final: scripted recordings of the real app with a
visible cursor (plan a week, answer a question and ask Willo, take a
mock test section, review a mistake, read analytics). They are recorded
from the built product so they match it exactly, and embedded in the
feature rows with poster frames and a play control.

## 13. Build order

1. Tokens (colours, radius, shadow, type), buttons, inputs, chips.
2. Illustration components; Willo motion retune.
3. App shell (sidebar, top bar, phone tabs).
4. Dashboard.
5. Study plan, Focus, Practice, question screen with tutor panel.
6. Mock tests list and results, Mistake notebook, Vocabulary.
7. Analytics, Settings, Billing, Onboarding, empty and loading states.
8. Landing page with scroll story.
9. Dark mode pass, phone pass, accessibility and contrast checks.
10. Demo videos recorded from the real app; embed in the landing page.

Each step ends with typecheck, lint, the contrast check, a browser
check on desktop and phone, and a commit.
