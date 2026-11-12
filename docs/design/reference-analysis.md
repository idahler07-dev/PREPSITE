# Reference analysis: OnePrep, Linus, Stripe → WilloPrep

Sources: oneprep.com (server-rendered HTML, CSS and public illustration assets, Nov 2026),
linusprep.com (full-page capture), stripe.com and linear.app (captures). OnePrep blocks automated
browsers, so its layout below is read from its markup, styles and image assets, not a screenshot.

## 1. OnePrep, section by section

| # | Section | What is there | Wording pattern |
|---|---|---|---|
| 1 | Hero | H1 "Your All-in-One [rotating word]" with a hand-drawn SVG underline; one-line sub; 3 CTAs (Get started for free · I'm a parent · I'm an educator); floating product cards (Predicted SAT 1570 · +180 points; a live question with Mark for Review and Check Answer) over a layered illustrated landscape with blob mascots | Promise + concrete proof inside the product cards, not in the copy |
| 2 | How it works | "Diagnose, plan, & practice *smarter*", three numbered steps 01/02/03, each with a mini UI (predicted score + domain bars, a task list with minutes, mode cards) | Verb-first step titles: "Take your diagnostic", "Get your tailored plan", "Hit your target score" |
| 3 | Social proof ribbon | Infinite marquee of student cards (photo, flag, "1300 to 1550 in 10 weeks"), then a university logo marquee | Outcome in quotes, specific numbers and time span |
| 4–7 | Feature blocks | Each block = small label ("Question Bank") + problem headline + "Get started for free" + one specific sentence + a full working replica of the product (question with tabs, timer 00:14, Highlight, Mark for review, Ask Preppy chat; week planner with minutes and question counts; Google Calendar sync; analytics with accuracy by topic, pacing by difficulty, activity heatmap) | Headlines name the pain: "Never stay stuck on a question", "Stop wondering what to study next", "Know your weak spots before test day" |
| 8 | Masterclass | Teacher card ("Learn from a 1580 scorer") + infinite ribbon of strategy chips ("The Three Versus One Rule", "SOHCAHTOA Acronym", "Identify the main claim"…) | The ribbon shows breadth of content at a glance |
| 9 | Feature grid | "15+ other features": square tinted tiles with soft, slightly 3D icons (question bank, flashcards, lessons, cheat sheets, glossary, grade boundaries) | One noun per tile |
| 10 | Testimonials | Score pairs "1340 → 1490" with name | Number first |
| 11 | FAQ | Is it free? What makes it different? How accurate is the prediction? How does the AI work? Which exams? | The six objections a parent would raise |

**Visual system.** DM Sans for UI and headings, Geist Mono for numbers, Noto Serif only inside exam passages
(matches Bluebook). White page, `#e5e5e5` borders, and an accent *pair* per meaning: a pale tint as the
background with a saturated foreground (Math cyan `#1cb0f6` on `#cefbff`, English magenta on `#f9e6ff`,
Pro gold `#805c24` on `#fff7e8`). Illustration: one world (sky, low-poly mountains, floating islands,
blob mascots) used as the hero backdrop in background and foreground layers, and a separate flat-3D icon
family for feature tiles.

## 2. Linus

Dark brand field (deep green) with one loud accent (lime) on every primary button. The hero shows the real
dashboard inside a browser frame, with the mascot peeking over the frame's edge. The dashboard itself:
"Welcome back, Niko" + "You have a 5-day streak. Keep it up." + weekday streak dots; three KPI tiles
(Days until test with a date chip, Target score with edit, Predicted score range); a "Today's focus" coach
note; "Your goals" as tasks tagged by impact with a Start button.

## 3. Stripe / Linear

Product UI is the illustration. Bento cards, 1px hairlines, one gradient flourish, tight geometric type,
no stock photos.

## 4. What WilloPrep takes, and what it does differently

- **Structure from OnePrep:** label → problem headline → one specific sentence → live product UI, for every
  feature block. Numbered how-it-works with mini UIs. A skill ribbon (all 8 SAT domains and their skills,
  colour-coded Math vs Reading & Writing) instead of university logos.
- **Dashboard from Linus, re-ordered:** the first row answers *what do I do now?* (today's sessions, minutes,
  why each was picked, one Start button) and *am I on track?* (predicted range, target, trend). Second row:
  the week. Third: skills with a "Focus next" flag, and the two review queues (mistakes, vocabulary).
- **Type:** Plus Jakarta Sans (display), Inter (UI), Geist Mono (scores, minutes, dates). No decorative serif.
  A serif appears only inside reading passages in the test player, as on Bluebook.
- **Colour pairs:** Math teal on pale teal, Reading & Writing orange on pale peach, Review gold, Vocabulary rose,
  Success green. Buttons are the deep orange `#C44D17` (AA with white text).
- **One illustrated world:** a willow valley (sky, sun, hills, willow tree) behind the hero, and a small motif
  family (target, calendar, flame, notebook, word cards, bulb) that sits inside tinted cards, partly cropped
  by the card edge so it reads as part of the card.
- **Three art styles to choose from**, all drawn from the same shapes: cartoon (the original Willo, soft
  gradients), paper-cut (`scripts/willo-papercut.py`: flat paper sheets, cast shadows, fibre), and ink
  (the current illustrated Willo, warm-brown outlines).
- **Honesty rule kept:** no invented student counts, testimonials or university logos. Proof comes from the
  product cards (predicted score, a real question, a real plan).

## 5. Copy (landing, first screen)

- Announcement: "New · Full adaptive mock tests with a section-by-section score report →"
- Label: "For the digital SAT · Math and Reading & Writing"
- H1: "Know exactly what to study **today**." (orange word, hand-drawn underline)
- Sub: "WilloPrep turns your test date and your mistakes into a short daily plan, then explains every question you miss."
- CTAs: "Start free" · "Try a sample question"
- Line under CTAs: "Free plan forever · Premium $9.99/mo · no card to start"
- How it works: "Diagnose. Plan. Practice." — 01 Take a short diagnostic · 02 Get a plan for your test date · 03 Practice and never stay stuck

## 6. Measured (computed styles, Nov 2026)

| | Stripe | Linear | Linus |
|---|---|---|---|
| Display type | Söhne, **weight 300**, h1 48/55 ls −0.02em, h2 32, card titles 26 | Inter Variable **510**, h1 64/64 ls −0.022em, h2 48/48 | Gibson Medium 64/68 |
| Body | 14–16, weight 300–400 | 15/24, grey `#8A8F98` | 17 |
| Headline device | Two-tone: first clause ink, rest muted or coloured | Grey lead-in + white emphasis | Single colour |
| Buttons | 4px radius, 48px tall, 16px label, solid indigo | Pill, 44px tall (32 in nav), 16px/510 | Pill, lime on green |
| Cards | 6px radius, no border, shadow `0 16px 32px rgba(50,50,93,.12)` | 8–12px radius, 1px `rgba(255,255,255,.08)` hairline, no shadow | Rounded, product screenshots |
| Rhythm | Bento grid, product UI as the art | 128px top/bottom per section, 1344px container | Dark full-bleed bands |

What this means for WilloPrep: medium weights (500–600), not 800; one-colour icons; hairlines before shadows;
128px between sections; product UI as the main picture; two-tone headlines; pill buttons 44px.

## 7. Paper-cut, done well

References: the Mocha Studio cut-paper canvas (UX Pilot), Laura K Sayers' portfolio (layered hand-cut paper),
the Designmodo scrapbook round-up, and the cartoonperson.net style notes.

- One colour family per scene, stepped light to dark across 5–7 sheets (WilloPrep: a teal ramp `#E6EFEA → #3F7176`).
- One accent only (a small sun). Orange is saved for Willo and the call to action.
- Shadows are soft and short, cast up onto the sheet behind (light from the front), never black outlines.
- Mottled fibre, very low contrast (about 2–3%), generated as one large image so no tile seams show.
- Clean blade-cut edges: the paper-cut Willo now smooths every cut and keeps fewer, flatter pieces.
- Willo stands inside the scene, between sheets, so the front sheet overlaps his feet.
- UI stays modern (Inter, Geist Mono, hairlines). Paper is for the scene, cards and small vignettes, not for text.
