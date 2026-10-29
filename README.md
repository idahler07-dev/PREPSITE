# PrepSite — digital SAT preparation

Web app for a learning centre's SAT students: a question bank the centre owns, exam-like practice, and honest progress tracking. Built for students in Uzbekistan and Central Asia (English, Oʻzbekcha and Русский today; more languages are registered and switch on as they are translated).

> The brand name, logo, colors and contact details are placeholders. Change them in [`site.config.ts`](site.config.ts).

## Status

| Phase | Scope | State |
| --- | --- | --- |
| 1 | Setup, auth, branding, i18n (en/uz/ru), themes, question & source models, manual editor, CSV/Excel import, review queue, drills, basic test interface, dashboard | **Done** |
| 2 | PDF import (typed + scanned) and side-by-side review | **Done** |
| 3 | Full adaptive mock tests, Desmos, highlighter, reference sheet, scoring, reports | **Done** |
| 4 | AI tutor, mock test generator, AI-drafted questions | **Done** |
| 5 | Plans and payments (mock, Payme, Click, international cards), subscriptions | Next |
| 6 | Spaced repetition, vocabulary, study coach, notifications, remaining languages, PWA | Planned |
| 7 | Admin analytics, security hardening, accessibility audit, performance, docs | Planned |

Scope note: this is an individual-student site plus an admin side. Classes, teacher accounts, parent access and tutoring booking are intentionally **not** built.

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
| `JOBS_MODE` | optional | `worker` (default; in-process worker), `external` (cron calls `/api/jobs/run`) or `inline` (tests) |
| `CRON_SECRET` | if `external` | Bearer token for `POST /api/jobs/run` |
| `DESMOS_API_KEY` | Phase 3 | Desmos calculator (falls back to a basic calculator) |
| `PAYMENT_PROVIDERS` | Phase 5 | Enabled payment providers |
| `SENTRY_DSN` | optional | Error monitoring |

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

## Deploying

**Vercel:** create a Postgres database (Neon, Supabase, …) and an R2 bucket, set the environment variables, and use the build command `pnpm db:deploy && pnpm build`. Set `NEXT_PUBLIC_SITE_URL` before building.

**VPS:** Node 22 + Postgres 16, `pnpm install --frozen-lockfile && pnpm db:deploy && pnpm build && pnpm start` behind a reverse proxy with HTTPS (Caddy or nginx). `STORAGE_DRIVER=local` is fine on a single server; back up `STORAGE_LOCAL_DIR` along with the database.

Read [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) before going live — it includes legal items specific to Uzbekistan.

## More documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — how the code is organised and why
- [CONTENT_GUIDE.md](CONTENT_GUIDE.md) — importing, reviewing and coding questions
- [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) — everything to check before launch
- PAYMENTS.md — added in Phase 5

## Content rules

Questions come only from the centre's own materials (imported with a rights confirmation) or original AI drafts approved by a person. The site links to official free resources (College Board, Bluebook, Khan Academy) instead of hosting them, shows no College Board branding, labels every score as an estimate, and never shows invented numbers.

SAT® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this website.
