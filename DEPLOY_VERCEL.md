# Demo on Vercel

This puts a **demo** of the site on Vercel with a free Postgres database.
The demo has "Try as a student / Try as admin" buttons (no email needed) and
test payments only. Don't use these settings for the real launch — see
LAUNCH_CHECKLIST.md.

## 1. Create the project

1. Sign up at <https://vercel.com> with your GitHub account.
2. **Add New → Project**, choose the `prepsite` repository, **Import**.
3. Leave the framework as **Next.js**. The build command comes from `vercel.json`
   (it runs the database migrations, loads the sample questions and builds).

## 2. Add a database

In the new project: **Storage → Create Database → Neon (Postgres)** → Create →
connect it to the project. Vercel adds `DATABASE_URL` automatically.

## 3. Environment variables

**Settings → Environment Variables** — add these (all environments):

| Name | Value |
| --- | --- |
| `AUTH_SECRET` | a random string — e.g. from <https://generate-secret.vercel.app/32> |
| `NEXT_PUBLIC_SITE_URL` | your Vercel address, e.g. `https://prepsite-demo.vercel.app` |
| `AUTH_URL` | the same address |
| `AUTH_TRUST_HOST` | `true` |
| `DEMO_MODE` | `true` |
| `JOBS_MODE` | `inline` |
| `CRON_SECRET` | another random string |
| `PAYMENT_PROVIDERS` | `mock` |
| `ALLOW_MOCK_PAYMENTS` | `true` |
| `EMAIL_TRANSPORT` | `outbox` |
| `ALLOW_DEV_OUTBOX` | `true` |
| `MAIL_OUTBOX_DIR` | `/tmp/dev-mail` |
| `STORAGE_DRIVER` | `local` |
| `STORAGE_LOCAL_DIR` | `/tmp/storage` |
| `ANTHROPIC_API_KEY` | optional — turns on the AI tutor and AI drafts |

## 4. Deploy

**Deployments → Redeploy** (or push to the branch). Vercel deploys the
repository's default branch to your main address; to use this work branch, set
it under **Settings → Git → Production Branch**, or merge it into `main` first.

Open the address, click **Sign in**, then **Try as a student** or **Try as admin**.

## Demo limits

- Files you upload (PDFs, images) are kept only briefly: Vercel has no
  permanent disk. For real use, set `STORAGE_DRIVER=s3` with Cloudflare R2.
- Emails are not really sent (they're written to a temporary folder).
- Background jobs run inside the request (`JOBS_MODE=inline`): large PDF
  imports may time out. The daily job runs once a day via Vercel Cron.
- The demo has the 40 sample questions plus anything you add. A full
  practice test needs 81 Reading and Writing and 66 Math published questions.
