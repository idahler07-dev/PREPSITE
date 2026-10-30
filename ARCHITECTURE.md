# Architecture

A single Next.js 15 (App Router) application with PostgreSQL. Server components render pages; route handlers and server actions change data. Everything that matters for security — who may see what, answer keys, timing — is decided on the server.

## Folder layout

```
site.config.ts              brand name, logo, colors, contact, code format (public, no secrets)
messages/{locale}.json      every UI string (en is the source; others must have the same keys)
content/legal/{locale}/     terms, privacy and refund text (Markdown; falls back to English)
prisma/
  schema.prisma             data model
  migrations/               SQL migrations (pnpm db:migrate / db:deploy)
  seed.ts, seed-data.ts     development sample questions (isSample = true)
src/
  app/[locale]/(main)/      pages with the site header and footer
  app/[locale]/(focus)/     the full-screen test interface
  app/manage/              Manage area (owners only, see OWNER_EMAILS)
  app/api/                  route handlers (auth, attempts, assets, admin uploads)
  components/               UI (components/ui = shadcn/ui primitives)
  config/test-structure.ts  sections, modules, question counts and times
  i18n/                     locales, routing, message loading
  lib/                      pure logic shared by server and browser (no database)
  server/                   server-only code: services, actions, auth, storage, mail
  middleware.ts             locale routing + per-request CSP nonce
scripts/                    command-line tools (translation check, remove samples)
tests/unit, tests/integration, tests/e2e
```

`src/lib` holds pure functions (SPR answer checking, codes, flags, fingerprints, drill selection, streaks, Markdown rendering). They have no database access, which keeps them easy to unit-test and safe to use in the browser. `src/server` holds everything that touches the database, storage or secrets; each module imports `server-only` so it can't end up in a browser bundle.

## Data model (main tables)

- **User / Account / VerificationToken** — Auth.js tables (one kind of user, no roles) plus language, theme, time zone and goal (test date, target and current score).
- **Source** — who owns a set of questions, the exact rights statement that was confirmed, who confirmed it and when. `withdrawnAt` is set when permission is withdrawn.
- **SourceFile** — an original uploaded file (spreadsheet; PDFs in Phase 2) in private storage, with its SHA-256.
- **ImportBatch** — one upload: defaults (section, difficulty, code prefix), the per-row analysis, and its own rights confirmation (every upload repeats it).
- **Question** — the bank (fields as in the brief). `flags` holds automatic review flags; `fingerprint` is normalised text for near-duplicate detection; provenance fields point to the source, file, page or row and importer. `version` increments on every save.
- **QuestionVersion** — full snapshot after every save. Restoring an old version creates a new version; history is never rewritten.
- **QuestionAsset** — figures in private storage, referenced from Markdown as `![alt](asset:<id>)`.
- **QuestionReport** — student error reports (one open report per student per question).
- **Attempt → AttemptModule → Response** — any practice session. A drill is one module; a full test (Phase 3) has four. Each response stores the answer, flag, crossed-out choices, time spent and grading.
- **RateLimit** — fixed-window counters (works across serverless instances).
- **AuditLog** — owner actions (source withdrawal, imports, sample removal).

## Request flow and authorization

- `middleware.ts` picks the locale (URL prefix, then the `NEXT_LOCALE` cookie, then the browser language) and creates a nonce for the Content Security Policy.
- Pages call `requireUser()`, and every `/manage` page and layout calls `requireOwner()` (`src/server/auth/session.ts`). An owner is a user whose **verified** email is listed in `OWNER_EMAILS` (`src/server/auth/owner.ts`). Manage pages return **404** to everyone else, so the area can't be discovered.
- Route handlers and server actions call `requireApiUser()`, or `requireApiOwner()` for `/api/manage/*` and `src/server/actions/admin/*` (404 for non-owners). State-changing route handlers also check the `Origin` header (`assertSameOrigin`); server actions get the same check from Next.js.
- Sessions are JWTs (required for the Telegram provider), but every request loads the user from the database, so deleted accounts and owner changes take effect immediately.

## Authentication

Auth.js v5 with three methods:
- **Email magic link** — custom sender (`src/server/mail`): Resend, SMTP, or a development outbox (`.data/dev-mail`). Rate-limited per address and per IP.
- **Google** — enabled when `AUTH_GOOGLE_ID/SECRET` are set. Linking to an existing account with the same email is allowed because Google verifies addresses.
- **Telegram Login** — the official widget; the payload's HMAC is verified with the bot token (`src/lib/telegram.ts`) and logins older than a day are refused.

All methods land on `/api/post-login`, which applies the user's saved language and sends new users to onboarding.

## Questions: content, flags, versions

Question text is Markdown with LaTeX math (`$…$` inline, `$$…$$` display). `src/lib/markdown/render.ts` turns it into HTML through one unified pipeline: Markdown → HTML (raw HTML is never passed through) → **sanitize** → private images only (`asset:` links; external images are dropped) → KaTeX (`trust: false`). The same function runs on the server for students and in the browser for the editor's live preview.

Automatic flags (`src/lib/questions/flags.ts`) are recomputed on every save. Blocking flags (missing answer, uncertain text, not four choices, answer not a choice, invalid SPR answer) prevent publishing; warnings (missing figure, near-duplicate, code reassigned, student report…) are acknowledged by approving. Status moves `DRAFT → IN_REVIEW → PUBLISHED`, or to `RETIRED`. Only `PUBLISHED` questions are ever selected for students.

Codes follow `questionCodes.format` in `site.config.ts` (default `{prefix}{domain}-{number}` → `LC-M-ALG-0001`). The next number is the highest existing number for that prefix and domain plus one; the database enforces uniqueness.

## Imports

Spreadsheets (CSV or XLSX) go through two steps:
1. **Upload** (`/api/manage/imports/spreadsheet`): rights confirmation required; the original file is stored privately with its hash; every row is validated and analysed (taxonomy, codes, flags, near-duplicates against the bank and within the file). Nothing is created yet.
2. **Confirm**: the batch is claimed (so a double click can't import twice), the stored file is re-read, and valid rows become `DRAFT` questions with full provenance and a first version. Rows with errors are skipped and listed.

Images referenced by `image_url` are downloaded server-side only from public https addresses (private networks are refused), size-limited and type-checked by their bytes.

### PDF import

1. **Upload** (`/api/manage/imports/pdf`): creates the batch (rights confirmation required) and one `SourceFile` per PDF, and returns upload targets. The browser uploads straight to storage (presigned PUT for S3/R2, `/api/manage/uploads/[fileId]` for local disk), then calls `/start`.
2. **Jobs** (pg-boss, schema `pgboss`; see `JOBS_MODE`):
   - `pdf-import-prepare` checks each file (magic bytes, size, encryption, page count ≤ 400) and creates one `ImportPage` per page.
   - `pdf-import-page` renders the page to PNG (pdf.js + @napi-rs/canvas, `isEvalSupported: false`) and reads it: with `ANTHROPIC_API_KEY`, Claude reads the page image (structured JSON output validated with Zod; usage logged to `AiUsage`); otherwise the text layer is parsed (`src/lib/import/pdf-text.ts`). Scanned pages without a key fail with `NO_TEXT_LAYER`. Retryable AI errors are retried twice.
   - `pdf-import-finalize` (exclusive, claimed via status `FINALIZING`) merges questions split across pages, matches the answer key by number (in document order, so restarted numbering per module works), crops figures into `QuestionAsset`s, assigns codes, checks near-duplicates and creates `DRAFT` questions with `TAXONOMY_UNCONFIRMED` (blocking until a person confirms domain and skill).
3. **Review**: `/manage/import/[batchId]/review` shows the original page image next to the editor.

The AI is only asked to transcribe what is on the page; it never writes content.

## Practice tests (adaptive)

- **Structure** (`src/config/test-structure.ts`): module sizes, times, the break and the 5-minute warning.
- **Blueprint** (`src/config/mock-blueprint.ts`): questions per domain in a module, difficulty mix for module 1 and the easier/harder module 2, the routing threshold, and the score table.
- **Assembly** (`src/lib/mock/assemble.ts`): deterministic and seeded. For each section it builds module 1 plus both module-2 versions, never repeats a question in one test, prefers questions the student hasn't seen, fills gaps from the nearest difficulty and then other domains, and reports what it couldn't fill. The result is stored in `MockTest`/`MockModule` with its seed, so a test always has the same questions.
- **Taking a test** (`src/server/mock/service.ts`): `startMock` creates the attempt (full test, one section, or module 1 only). When module 1 is submitted, `afterMockModule` picks module 2 from the share correct (`routeModuleTwo`) and fills it; between sections it sets `Attempt.breakEndsAt`. On completion `scoreAttempt` stores the estimate in `Attempt.scores`.
- **Scoring** (`src/lib/mock/scoring.ts`): straight lines between the anchor points of the route's table, rounded to 10, with a ± range. Always labelled an estimate.
- **Test tools**: highlights and notes are stored per attempt and question (`Annotation`, character offsets into the passage text). The calculator is Desmos when `DESMOS_API_KEY` is set, otherwise our own scientific calculator (`src/lib/calc.ts`, a parser, never `eval`). The reference sheet is our own.

## AI features

All calls go through `src/server/ai/` (server-side only) and are logged in `AiUsage` with tokens and an estimated cost (Admin → AI usage).

- **Tutor** (`tutor.ts`, `tutor-prompt.ts`, routes `/api/ai/tutor` and `/api/ai/tutor/chat`, NDJSON streams). Modes: hint, explain, why-my-answer-is-wrong, another method, simpler. Access is checked on the server: explanations only after the response is graded (so tests never leak answers), hints only in check-as-you-go drills. The model receives the question (with its images), the answer key, the stored explanation and the student's answer; the student's own text is wrapped in `<student_message>` and treated as content. Every reply starts with a hidden `VERDICT:` line (`src/lib/ai/verdict.ts`): on `DISAGREE` nothing is shown, the question gets the `AI_KEY_DISPUTE` flag and the student sees the stored explanation. Replies are cached per question version, language, mode and chosen choice (`AiExplanation`); cached replies cost nothing and don't count toward the daily limit (`src/config/ai-limits.ts`). Follow-ups are stored in `AiConversation`, capped per question.
- **Drafted questions** (`draft-questions.ts`, job `ai-draft-questions`). Staff choose section, domain, skill, difficulty and count; optional style examples are our own published questions (never AI drafts or samples). Each draft is solved by a second call that never sees the key (`AI_SOLVER_DISAGREES`, `AI_AMBIGUOUS`), and Math drafts carry an arithmetic expression checked with mathjs (`src/lib/ai/math-check.ts`, whitelisted functions only; `MATH_CHECK_FAILED`). Drafts are saved as `DRAFT` with origin `AI_DRAFTED` and the blocking `AI_UNREVIEWED` flag, which only a save in the editor clears.

## Plans and payments

- **Plans and limits**: `src/config/plans.ts` (prices in UZS and USD, period lengths, free limits, reminder days, grace period, referral rewards). Limits are enforced on the server: `assertQuestionAllowance` in `createDrill`, `assertTestAllowance` in `startMock`, and the AI tier in the tutor (`src/server/billing/entitlement.ts`).
- **Subscriptions** are prepaid periods (`Subscription`), stacked: a renewal starts where the current period ends. State (`src/lib/billing/subscription.ts`): active → expiring (last 7 days) → grace (3 days after the end, premium still on) → expired. Refunds cancel the order's period.
- **Orders**: `CREATED → PENDING → PAID | FAILED | CANCELED | REFUNDED` (`src/server/payments/orders.ts`). `markPaid` is idempotent: the first call creates the subscription, the referral bonus and the receipt. Amounts are stored in minor units (tiyin/cents).
- **Providers** (`src/server/payments/providers/*`, interface in `types.ts`): hosted checkout only. Callbacks arrive at `/api/payments/[provider]/webhook`:
  - **Payme**: Merchant API JSON-RPC, Basic auth `Paycom:<key>`, amount in tiyin, 12-hour timeout, account field `order_id` = order number. Refunds are made in the Payme cabinet (Payme then calls `CancelTransaction`).
  - **Click**: SHOP API Prepare/Complete with the MD5 `sign_string`; `merchant_trans_id` = order number. Refund via the Merchant API reversal (if enabled for the service).
  - **Octo** (USD): `prepare_payment` → `octo_pay_url`; notifications are verified by re-reading the status from Octo's API before anything changes.
  - **Mock**: HMAC-signed callbacks and our own "hosted" page, for development and tests.
  Each provider transaction is stored in `PaymentTransaction` (provider retries are answered from it); every callback is logged in `PaymentEvent` (unique per provider event id, so repeats are ignored).
- **Daily job** (`billing-daily`, 09:17 Tashkent; `src/server/billing/daily.ts`): cancels unpaid orders after 24 h, sends renewal reminders (email + Telegram) 3 and 1 days before the end, and reconciles pending/recent orders with providers that can report a status.
- **Referrals**: `?ref=CODE` sets a cookie; the account created next is linked to the referrer. The friend's first purchase gets a discount; the referrer gets bonus days when it is paid.

## Learning tools

- **Mistake notebook** (`src/server/review/service.ts`, SM-2 in `src/lib/srs/sm2.ts`): after grading, wrong answers (and blanks in tests) and marked questions become `ReviewItem`s due tomorrow. Review sessions are `REVIEW` attempts; their answers reschedule the items (right = quality 4, wrong = 1). Items with an interval over 60 days are archived as learned.
- **Daily question**: one `DAILY` attempt per student per day, a published unseen question chosen with a seed of user id + date.
- **Bookmarks and notes**: `QuestionNote`, only for questions the student has been given.
- **Vocabulary**: `VocabWord` (our own sentences; starter set in `prisma/vocab-data.ts`, seeded) and `VocabProgress` (SM-2; again/hard/good/easy = 1/3/4/5). Up to 10 new words per session.
- **Official scores**: students log official practice test scores and missed skills (`OfficialScore`); the dashboard and coach use them.
- **Study coach** (`src/lib/coach/plan.ts` rules, `src/server/coach/service.ts`): a weekly plan from the test date, accuracy by skill (last 60 days), due reviews and whether a practice test is allowed. Rebuilt after every scored test and on request; the AI only adds a short note (`coach` feature, fast model).
- **Notifications** (`src/config/notifications.ts`, `src/server/notify/*`): kinds study / streak / newTests / renewals by email and Telegram, per-student preferences, each sent once (`NotificationLog`). Jobs: `evening-reminders` (18:47 Tashkent), `announce-test` (when a practice test is published), renewals from `billing-daily`.
- **PWA**: `src/app/manifest.ts`, icons from `scripts/make-brand.ts`, `public/sw.js` (static files cache-first; test pages cached on open so a drill keeps working offline; offline page). Registered only in production.

## Analytics, calibration and operations

- **Admin → Analytics** (`src/server/analytics/overview.ts`): students, active users, premium share, answers per day, signups per week, practice tests, hardest skills.
- **Calibration** (`src/lib/analytics/calibration.ts`, run nightly with the daily job): questions with 30+ answers get a measured `difficultyRating` (1 − accuracy); a label outside its expected accuracy band adds `DIFFICULTY_MISMATCH`, and a wrong choice picked more often than the key adds `ANSWER_PATTERN`.
- **Errors**: `onRequestError` in `src/instrumentation.ts` logs one JSON line per error and, with `SENTRY_DSN`, sends it to Sentry (`src/server/observability.ts`, no SDK).
- **Guards test** (`tests/unit/route-guards.test.ts`): fails if any API route or server action lacks an auth check, or a state-changing route lacks the same-origin (CSRF) check.
- **Accessibility test** (`tests/e2e/a11y.spec.ts`): axe (WCAG 2.1 AA) on public, student and admin pages; serious or critical issues fail the build.
- **Demo mode** (`DEMO_MODE`): adds a "demo" credentials provider (fresh student per visit, shared admin) and a banner. Off for the real site.
- **Hosting**: `Dockerfile` + `docker-compose.prod.yml` (app, Postgres, Caddy) — see DEPLOY.md; `vercel.json` for the Vercel demo.

## Practice engine

`src/server/attempts/service.ts`:
- **Building a drill** — published questions matching the filters; unseen questions first; random but reproducible (the seed is stored on the attempt); Reading and Writing before Math.
- **The test screen** receives question HTML, choices and the student's own state — never correct answers or explanations. In drills with immediate feedback, a question's key is sent only after the student checks that answer, and the answer is then locked. In tests, keys are revealed only after the module is submitted.
- **Timing is server-authoritative**: a module has `startedAt` and `timeLimitSec`; answers saved more than 30 s after the deadline are refused, and opening an expired module submits it automatically. The browser countdown uses the server clock offset.
- **Autosave** — changes are batched and sent every ~0.6 s; unsent changes are kept in `localStorage` and replayed after a reload or when the connection returns. Time per question is counted only while the page is visible.
- **Submitting** claims the module first (safe against double submission), grades every response, and updates per-question statistics for later difficulty calibration.

SPR answers (`src/lib/questions/spr.ts`) follow the SAT entry rules: up to 5 characters (6 with a minus sign), fractions need not be reduced, equivalent forms are accepted, and long decimals are accepted when truncated or rounded and filling the available space.

## Internationalisation

next-intl with locale-prefixed URLs (`/en`, `/uz`, `/ru`). `src/i18n/locales.ts` registers all 13 planned languages (Arabic marked right-to-left); only the enabled ones are routed. Missing keys fall back to English at runtime, `pnpm i18n:check` reports them, a unit test fails if an enabled language is missing a key or has different placeholders, and another test parses every message as ICU. The ESLint rule `react/jsx-no-literals` stops hard-coded UI text. Questions themselves stay in English.

## Security measures in place

- Per-request nonce CSP with `strict-dynamic`; `frame-ancestors 'none'`; HSTS, `nosniff`, referrer and permissions policies.
- Server-side authorization on every page, action and route; the Manage area returns 404 to non-owners (`tests/integration/owner-access.test.ts`, `tests/e2e/owner.spec.ts`).
- Zod validation on every input; Origin check on route handlers.
- Postgres-backed rate limits on sign-in, uploads, imports, drill creation and reports.
- Private storage only; files are served through authenticated routes (local) or short-lived signed URLs (S3/R2). Uploaded images are identified by their bytes, not the browser's claim; SVG is not accepted.
- Answer keys never reach the browser early (covered by integration tests).
- Markdown is sanitized; KaTeX runs with `trust: false`.
- Audit log for sensitive admin actions.

## Tests

- **Unit** (`tests/unit`): SPR rules, grading, codes, flags, near-duplicates, Markdown sanitising, translations, drill selection, streaks, Telegram verification, spreadsheet parsing.
- **Integration** (`tests/integration`, real Postgres): question lifecycle and versions, code suggestion, source withdrawal, student reports, import analysis and commit, drill building, answer-key secrecy, ownership checks, autosave, immediate feedback, grading and stats, server-enforced time limits.
- **End-to-end** (`tests/e2e`, Playwright on a production build): sign-up → onboarding → drill → results → dashboard; resume after reload; admin area hidden from students; language switch; admin spreadsheet import → review → publish → question appears in a student drill; manual editor publishing.
