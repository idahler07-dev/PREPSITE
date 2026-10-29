# Launch checklist

Work through this before real students use the site. Items marked ⚖️ need a lawyer or the centre's management.

## Legal and policy

- [ ] ⚖️ **Personal data stored in Uzbekistan.** Uzbekistan's Law on Personal Data (as amended in 2021) requires personal data of Uzbek citizens processed with information systems to be stored on servers physically located in Uzbekistan. Confirm what this means for you before choosing hosting — it may rule out a database and file storage abroad (e.g. Vercel + Neon + R2) and point to a local VPS or data centre. Also check whether the centre must register as a personal-data operator.
- [ ] ⚖️ Replace the draft texts in `content/legal/en/` (terms, privacy, refunds) with final versions, and add Uzbek and Russian versions in `content/legal/uz/` and `content/legal/ru/`. Then set `legalPagesAreDrafts: false` in `site.config.ts` to remove the "Draft text" notice.
- [ ] ⚖️ Confirm the refund policy matches what you will actually do and what the payment providers require (Phase 5).
- [ ] Footer shows the trademark disclaimer (it does by default; don't remove it).
- [ ] No College Board logos or Bluebook branding anywhere (check your own logo and any images you upload).

## Content

- [ ] `pnpm samples:remove` — delete the 40 development sample questions. The admin overview shows a warning while any remain.
- [ ] Every published question comes from a source with a rights confirmation (Admin → Sources).
- [ ] Enough published questions in every domain for drills (Admin → Overview shows counts per domain).
- [ ] Spot-check questions on a phone and in dark mode.

## Branding and configuration

- [ ] `site.config.ts`: name, legal name, logo files in `public/brand/`, colors (keep text contrast at 4.5:1), contact details, Telegram link, default language.
- [ ] `messages/*.json`: review the Uzbek and Russian wording with a native speaker (machine-assisted first drafts).

## Environment (production)

- [ ] `DATABASE_URL` points to the production database; backups are enabled and a restore has been tested.
- [ ] `AUTH_SECRET` is a new random value (`openssl rand -base64 32`), not the development one.
- [ ] `AUTH_URL` and `NEXT_PUBLIC_SITE_URL` are the public `https://` address. `NEXT_PUBLIC_SITE_URL` is set **before** `pnpm build`.
- [ ] `ADMIN_EMAILS` lists the real admins.
- [ ] `EMAIL_TRANSPORT` is `smtp` or `resend` (the `outbox` transport refuses to run in production), `EMAIL_FROM` uses your domain, and SPF/DKIM are set for it. Send yourself a sign-in link to test.
- [ ] Storage: `STORAGE_DRIVER=s3` with a **private** bucket (no public access), or `local` with the folder included in backups.
- [ ] Google sign-in (optional): OAuth client with redirect URI `https://<your-domain>/api/auth/callback/google`.
- [ ] Telegram Login (optional): bot created with @BotFather, `/setdomain` set to your domain, `TELEGRAM_BOT_TOKEN` and `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` set.
- [ ] `ALLOW_DEV_OUTBOX` is **not** set.
- [ ] Optional: `SENTRY_DSN` for error reports.
- [ ] `ANTHROPIC_API_KEY` set if you import scanned PDFs; set a monthly spend limit in the Anthropic console.
- [ ] Background jobs: on a VPS keep `JOBS_MODE=worker`. On serverless hosting set `JOBS_MODE=external`, a random `CRON_SECRET`, and a cron that calls `POST /api/jobs/run` with `Authorization: Bearer <CRON_SECRET>` every minute.
- [ ] With R2/S3 storage, add a CORS rule on the bucket allowing `PUT` from your site origin (browsers upload PDFs straight to storage).

## Deploy

- [ ] `pnpm db:deploy` applied all migrations.
- [ ] HTTPS works and HTTP redirects to HTTPS.
- [ ] Response headers include `Content-Security-Policy` and `Strict-Transport-Security` (check with your browser's developer tools).

## Final checks

- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e` pass.
- [ ] `pnpm i18n:check` shows no missing keys for enabled languages.
- [ ] Sign up as a new student → onboarding → drill → results → dashboard, on a phone and a laptop.
- [ ] A student account gets "Page not found" at `/en/admin`.
- [ ] Data export (Settings → Download CSV) and account deletion work.
- [ ] Lighthouse (mobile) on the home page: aim for 90+ in every category.
