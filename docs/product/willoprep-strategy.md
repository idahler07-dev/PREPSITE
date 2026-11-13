# WilloPrep: research summary and product strategy

November 2026. Supersedes the "Satify" naming; the v3 design plan
(`docs/design/satify-v3-plan.md`) still governs layout and motion.

## 1. Research summary

### What I could and could not access

- **Accessed:** College Board pages, third-party comparisons, vendor
  pricing pages, one peer-reviewed-style paper (arXiv), via web search.
- **Not accessed:** Reddit. Reddit refuses automated access from this
  environment, so nothing below is a first-hand Reddit finding. Where a
  source *claims* to summarise r/Sat, it is marked "second-hand".

### Official SAT facts the product must respect

- Two sections, Reading and Writing then Math, each split into two
  modules; adaptivity is per module: module 1 performance sets the
  difficulty range of module 2 ([College Board help
  centre](https://satsuite.collegeboard.org/help-center/how-can-test-be-hour-shorter-still-measure-same-things-just-effectively),
  [College Board blog](https://blog.collegeboard.org/what-digital-sat-adaptive-testing)).
- Commonly cited timing: R&W 2 × 32 min, 27 questions each; Math
  2 × 35 min, 22 questions each; 10-minute break; scores 200–800 per
  section, 400–1600 total ([PrepScholar](https://blog.prepscholar.com/digital-sat-format),
  [Assessment framework PDF](https://satsuite.collegeboard.org/media/pdf/assessment-framework-for-digital-sat-suite.pdf)).
  Our mock blueprint already follows this.
- Official free practice: full-length adaptive tests in Bluebook and a
  Student Question Bank of 3,500+ released questions filterable by
  section, domain, skill and difficulty
  ([Bluebook practice](https://satsuite.collegeboard.org/practice/practice-tests/bluebook),
  [Question bank](https://satsuite.collegeboard.org/k12-educators/tools-resources/question-bank)).

### Competitors

| Product | Strength | Weakness | Price |
|---|---|---|---|
| Bluebook (College Board) | The real interface; official adaptive tests | Few tests; little guidance after scoring | Free |
| Khan Academy | Official partner; free lessons and practice; links from Bluebook results | Little test strategy; second-hand reports of a plateau near 1400 ([review](https://testprepnerds.com/sat/khan-academy-sat-prep-review/), [edisonos](https://www.edisonos.com/digital-sat/test-providers)) | Free; Khanmigo about $4/mo |
| UWorld | Deep, visual explanations; large bank | Imitation items; expensive; no planner on the base tier ([review](https://testprepinsight.com/reviews/uworld-sat-prep-review/)) | about $99–$449 |
| AI SAT apps (Acely, PrepGraph, AlphaTest, Test Advantage) | Adaptive plans, AI tutors | $17–$149/mo ([comparison](https://prepgraph.com/blog/best-ai-sat-tutors-2026), [Acely](https://acely.com/blog/best-sat-prep-options-2026)) | High |
| Google Gemini | Free SAT practice inside Gemini since Jan 2026 ([aitoolsbakery](https://aitoolsbakery.com/blog/best-ai-sat-prep-apps/)) | Generic chat, no plan or tracking | Free |

**Takeaways**

1. Free content is abundant (Bluebook, Khan, the question bank,
   Gemini). Content alone will not sell; what students lack is **a
   system that says what to do today and proves it is working**.
2. Students use two tools: Bluebook for realism, a bank for drilling
   (second-hand). WilloPrep should be both in one place, with the
   Bluebook-faithful runner we already have.
3. $9.99/mo is at the low end of AI SAT apps and above Khanmigo. It is
   defensible if Premium means the tutor, unlimited practice and
   adaptive planning, not artificial locks.

### Learning research that shapes the tutor

- A hint-first tutor did not hurt later exam scores, while an
  answer-giving chat did (PNAS 2025, reported second-hand by
  [alai](https://tryalai.app/homework-help-without-answers); not verified
  against the paper).
- Students rate step-by-step feedback the most useful feature of an AI
  homework tutor ([aiPlato, arXiv 2601.09965](https://arxiv.org/pdf/2601.09965)).
- Plans fail when unfinished work piles up day after day
  ([NUS](https://nus.edu.sg/uhc/resources/articles/details/four-questions-to-check-in-with-yourself-to-combat-exam-burnout)).
  **Design rule:** missed tasks are re-spread automatically, never
  stacked as guilt.

### Design references

Apple (type and restraint), Linear (navigation and density), Stripe
(charts), Notion (calm workflows). Distinct WilloPrep traits: the
antler W, the deer, cyan to navy with a warm amber-brown accent, paper-cut
illustrations used sparingly.

## 2. Feature decisions

A = core, B = high value, C = optional, D = future, E = reject.

| Area | Decision | Class | Free / Premium | Status |
|---|---|---|---|---|
| Dashboard answering the four questions | Keep 8-section dashboard; "today" first | A | Free | Built (v3) |
| Question bank: filters, timed, mixed, bookmarks, history | Keep; add "weakness mix" | A | Free (20 q/day), Premium unlimited | Built (weak-spot mix in Quick start) |
| Explanations (stored, official) | Always free; the answer key is the source of truth | A | Free | Exists |
| Adaptive engine: weak skills, recurring mistakes, next step | One engine feeds plan, dashboard, notebook | A | Free basic, Premium adaptive re-plan | Exists in coach; extend |
| AI tutor: Explain, Hint, Teach, Challenge | Four modes, grounded in stored answers, off during mocks, no photos | B | **Premium only** | Rework modes now |
| Full adaptive mocks | Bluebook-faithful runner, results, next steps | A | Free 1, Premium unlimited | Exists |
| Mistake notebook | Auto-save, spaced review, tags, recurring patterns | A | Free | Built (why-missed tags, recurring patterns) |
| Study planner | Goal + date + time available → week plan; auto re-spread | A | Free plan, Premium adapts weekly | Built (missed days roll forward daily; Premium re-picks focus) |
| Vocabulary flashcards | Keep the SRS deck; no big investment (the SAT tests words in context) | C | Free | Exists |
| Analytics and readiness | Trend, per-skill, pace; forecast only with 4+ scores, labelled | A | Free core, Premium deep (timing, patterns) | Exists |
| Gamification | Streak + weekly goal only; no leaderboards, no XP in the chrome | C | Free | Simplified in v3 |
| Leaderboards | Compare-anxiety, little learning value | E | — | — |
| Focus timer | Simple 25/50 sessions tied to a plan task, logged as study time | C | Free | Build now |
| Onboarding | 3 steps: goal, date, minutes/day → diagnostic or log score | A | Free | Exists; trim |
| Photo upload to tutor | Rejected per brief (accuracy, cheating risk) | E | — | — |
| Peer tutoring, classes, parent reports | Later, once there is traction | D | — | — |

### One learning loop

Sign up → goal, test date, minutes a day → diagnostic (or logged
score) → week plan → practise → the tutor when stuck (Premium) →
mistakes saved and scheduled → plan re-weights by skill each week →
mocks → analytics → new recommendation on the dashboard. Every screen
reads from the same responses table, so there is one truth.

### Pricing

- **Free:** practice (20 questions/day), all official explanations, 1
  full mock, notebook, planner, focus timer, analytics core.
- **Premium $9.99/month** (UZS equivalent kept for local cards): the AI
  tutor (4 modes), unlimited questions and mocks, adaptive re-planning,
  deep analytics. Longer plans keep a discount.
- No dark patterns: the free tier is a complete way to study; upgrade
  prompts appear only where a Premium feature is used.

## 3. Brand

- **Name:** WilloPrep. **Mark:** a symmetrical antler W. **Mascot:** a
  deer, used in onboarding, empty states, encouragement and brand moments
  only. No 1600 badge.
- **Colour:** cyan and blue primary, deep navy contrast, ice and cloud
  surfaces, a restrained warm amber-brown accent (streaks, the
  mascot, highlights).
- The owner's drafted logo and mascot did not arrive in this session;
  the coded versions are built as swappable components
  (`src/components/brand/*`) so drafted art can replace them.
