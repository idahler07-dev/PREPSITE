# Deploying to production

Two supported setups. Pick one, then work through [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md).

## A. One server with Docker (recommended)

A VPS with 2 CPU / 4 GB RAM is enough to start. Choosing a data centre **in Uzbekistan**
keeps students' personal data in the country, as Uzbek law may require (see the checklist).

1. Install Docker on the server and clone the repository.
2. `cp .env.example .env` and fill it in. Also add:
   - `DOMAIN=prep.your-domain.uz` and point that domain's DNS A record to the server;
   - `POSTGRES_PASSWORD=` a long random password;
   - `AUTH_SECRET=` from `openssl rand -base64 32`;
   - email (`EMAIL_TRANSPORT=smtp` or `resend`), payments, `ANTHROPIC_API_KEY`, etc.
3. Start everything: `docker compose -f docker-compose.prod.yml up -d --build`
   - Migrations run on every start. Caddy gets an HTTPS certificate automatically.
   - Background jobs (PDF import, AI drafts, daily billing, evening reminders) run inside the app (`JOBS_MODE=worker`).
4. Optional: load the 30 starter vocabulary words (and, only on a test copy, sample questions):
   `docker compose -f docker-compose.prod.yml exec app pnpm db:seed`, then **remove samples** with
   `docker compose -f docker-compose.prod.yml exec app pnpm samples:remove`.
5. Sign in with an email from `ADMIN_EMAILS` to become admin.

**Updates:** `git pull && docker compose -f docker-compose.prod.yml up -d --build`

**Backups:** the database (`docker compose exec db pg_dump -U prep prepsite > backup.sql`, daily, kept off the server)
and the `appdata` volume (uploaded PDFs and images, unless you use S3/R2 storage). Test a restore before launch.

## B. Vercel + managed database

Works well, but the database and files are stored outside Uzbekistan — check the data rules first.

- Database: Neon or Supabase Postgres (`DATABASE_URL`).
- Files: Cloudflare R2 (`STORAGE_DRIVER=s3`, `S3_*`) with CORS allowing `PUT` from your domain.
- Jobs: `JOBS_MODE=external` and `CRON_SECRET`; Vercel Cron calls `/api/jobs/run`. On the Hobby
  plan crons run once a day, so PDF imports would wait — use a Pro plan (every-minute cron) or
  `JOBS_MODE=inline` for small imports only.
- Build command: `pnpm db:deploy && pnpm build` (no seed in production).
- The demo setup in [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md) is **not** for production (`DEMO_MODE` must be off).

## After deploying

- Visit `/en`, sign in, open Admin → Overview.
- Make a test purchase with each payment provider and refund it (Admin → Orders).
- Check Admin → AI usage after a day if the AI is on.
- Errors appear in the server logs as JSON lines; set `SENTRY_DSN` to also receive them in Sentry.
