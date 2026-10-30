# PrepSite — digital SAT preparation

Web app for a learning centre's SAT students: a question bank the centre owns, exam-like practice, and honest progress tracking. Built for students in Uzbekistan and Central Asia, in English, Oʻzbekcha and Русский.

> The brand name, logo, colors and contact details are placeholders. Change them in [`site.config.ts`](site.config.ts).

## Status

| Phase | Scope | State |
| --- | --- | --- |
| 1 | Setup, auth, branding, i18n (en/uz/ru), themes, question & source models, manual editor, CSV/Excel import, review queue, drills, basic test interface, dashboard | **Done** |
| 2 | PDF import (typed + scanned) and side-by-side review | **Done** |
| 3 | Full adaptive mock tests, Desmos, highlighter, reference sheet, scoring, reports | **Done** |
| 4 | AI tutor, mock test generator, AI-drafted questions | **Done** |
| 5 | Plans and payments (mock, Payme, Click, international cards), subscriptions | **Done** |
| 6 | Mistake notebook (SM-2), daily question, bookmarks and notes, vocabulary, official scores, study coach, notifications, PWA | **Done** (languages stay en/uz/ru by decision) |
| 7 | Admin analytics, question calibration, security hardening, accessibility audit, performance, docs | **Done** |

Scope note: this is an individual-student site plus an admin side. Classes, teacher accounts, parent access and tutoring booking are intentionally **not** built.

## What it does

**Students:** custom drills by skill, difficulty and question code, with immediate checking or end-of-set results · full adaptive practice tests (two modules per section, easier/harder module 2, break, timer with 5-minute warning) · exam-like test screen with highlighter and notes, answer eliminator, line reader, zoom, full screen, keyboard shortcuts, our own reference sheet and Desmos or a built-in calculator · estimated scores with a likely range, per-test reports with question codes and time · AI tutor (hints, step-by-step, why my answer is wrong, another method, simpler, follow-up questions) that never contradicts the key · mistake notebook on a spaced-repetition schedule, question of the day, bookmarks and notes · vocabulary flashcards · weekly study plan · logging official practice test scores · email and Telegram reminders · installable app that keeps open drills working offline · free plan and paid plans (Payme, Click, international cards), receipts, referral links.

**Staff:** question editor with live preview and version history · CSV/Excel and PDF import (typed or scanned, figures cropped, side-by-side review) with rights confirmation and provenance · review queue with automatic flags · AI-drafted questions checked by an independent solver and a calculator · practice test builder · vocabulary · sources and permission withdrawal · student reports · orders, refunds, promo codes, free premium grants · analytics and nightly question calibration · AI usage and cost.

## Requirements

- Node.js 22 (20.18+ works) and pnpm 10 (`corepack enable`)
- PostgreSQL 16 — `docker compose up -d` starts it (plus MinIO for S3-style storage)

## Run locally

```bash
pnpm install                 # also generates the Prisma client
cp .env.example .env         # then set AUTH_SECRET and ADMIN_EMAILS
docker compose up -d         # Postgres on :5432, MinIO on :9000 (console :9001)
pnpm db:migrate              # create the tables
pnpm db:seed                 # 40 development sample questions (marked as samples)
pnpm dev                     # http://localhost:3000
```

Sign in with an email listed in `ADMIN_EMAILS` to get the admin role. With `EMAIL_TRANSPORT=outbox` no email is sent: the sign-in link is printed in the terminal and saved under `.data/dev-mail/`.

## Environment variables

All secrets are environment variables; see [`.env.example`](.env.example) for every variable with comments.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `AUTH_SECRET` | yes | Signs sessions. `openssl rand -base64 32` |
| `AUTH_URL`, `NEXT_PUBLIC_SITE_URL` | production | Public URL of the site. `NEXT_PUBLIC_SITE_URL` must be set **at build time** |
| `ADMIN_EMAILS` | recommended | Comma-separated emails promoted to admin when they sign in |
| `EMAIL_TRANSPORT` | yes | `outbox` (dev only), `smtp` (+ `SMTP_URL`) or `resend` (+ `RESEND_API_KEY`) |
| `EMAIL_FROM` | production | Sender, e.g. `PrepSite <no-reply@yourdomain.uz>` |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | optional | Google sign-in |
| `TELEGRAM_BOT_TOKEN`, `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | optional | Telegram Login |
| `STORAGE_DRIVER` | yes | `local` (files on disk) or `s3` (Cloudflare R2 / MinIO) |
| `S3_*` | if `s3` | Endpoint, bucket and keys for private storage |
| `ANTHROPIC_API_KEY`, `AI_MODEL_FAST`, `AI_MODEL_SMART` | recommended | AI features (server-side only): scanned-PDF import, the AI tutor, AI-drafted questions. Without it the site works, minus these |
| `JOBS_MODE` | optional | `worker` (default; in-process worker and schedules), `external` (a cron calls `/api/jobs/run` every minute) or `inline` (jobs run inside the request: tests and small demos) |
| `CRON_SECRET` | if `external` | Bearer token for `POST /api/jobs/run` |
| `DESMOS_API_KEY` | optional | Desmos graphing calculator (falls back to our scientific calculator) |
| `PAYMENT_PROVIDERS` | for payments | Enabled providers: `mock`, `payme`, `click`, `octo` |
| `PAYME_MERCHANT_ID`, `PAYME_KEY`, `PAYME_SANDBOX` | Payme | Merchant id and cabinet key (test key in sandbox) |
| `CLICK_SERVICE_ID`, `CLICK_MERCHANT_ID`, `CLICK_MERCHANT_USER_ID`, `CLICK_SECRET_KEY` | Click | From the Click merchant cabinet |
| `OCTO_SHOP_ID`, `OCTO_SECRET`, `OCTO_TEST` | Octo | International cards (USD) |
| `MOCK_PAYMENT_SECRET`, `ALLOW_MOCK_PAYMENTS` | dev/staging | Test provider; refused in production unless allowed |
| `MAGIC_LINKS_PER_IP_HOUR` | optional | Sign-in emails per IP per hour (default 10) |
| `SENTRY_DSN` | optional | Error reports to Sentry (errors are always logged as JSON lines) |
| `DEMO_MODE` | demo only | "Try as student / admin" sign-in without email. Never on the real site |
| `MAIL_OUTBOX_DIR` | optional | Where the `outbox` email transport writes (e.g. `/tmp/dev-mail` on read-only hosts) |

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm start` | Develop, build, run in production mode |
| `pnpm lint` / `pnpm typecheck` | ESLint (including "no hard-coded UI text") and TypeScript |
| `pnpm test` | Unit and integration tests (Vitest). Integration tests use `TEST_DATABASE_URL` (default `…/prepsite_test`) |
| `pnpm test:e2e` | End-to-end tests (Playwright) against a production build on port 3100, database `…/prepsite_e2e` |
| `pnpm i18n:check` | Report missing translation keys and broken placeholders (`--strict` includes languages not enabled yet) |
| `pnpm db:migrate` / `pnpm db:deploy` | Create a migration in development / apply migrations in production |
| `pnpm db:seed` | Add the development sample questions |
| `pnpm samples:remove` | **Before launch:** delete all sample questions (`--dry-run` to preview) |
| `pnpm tsx scripts/make-icons.ts` | Make the app icons from `public/brand/mark.svg` |

## Deploying

- **Production:** see [DEPLOY.md](DEPLOY.md) — a VPS with Docker Compose (recommended for Uzbekistan's data-localization rules) or Vercel with a managed database.
- **A quick demo on Vercel:** see [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md).

Read [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) before going live — it includes legal items specific to Uzbekistan.

## More documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — how the code is organised and why
- [CONTENT_GUIDE.md](CONTENT_GUIDE.md) — importing, reviewing and coding questions
- [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) — everything to check before launch
- [DEPLOY.md](DEPLOY.md) and [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md) — hosting

## Content rules

Questions come only from the centre's own materials (imported with a rights confirmation) or original AI drafts approved by a person. The site links to official free resources (College Board, Bluebook, Khan Academy) instead of hosting them, shows no College Board branding, labels every score as an estimate, and never shows invented numbers.

SAT® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this website.
