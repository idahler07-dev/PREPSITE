# Production image. Build: docker build --build-arg NEXT_PUBLIC_SITE_URL=https://your-domain -t prepsite .
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN pnpm install --frozen-lockfile

FROM deps AS build
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=$NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
COPY . .
RUN pnpm prisma generate && pnpm build

FROM base AS run
ENV NODE_ENV=production PORT=3000
# Everything the app, migrations and seed need at runtime.
COPY --from=build /app /app
RUN useradd --system --uid 1001 app && mkdir -p /app/.data && chown -R app /app/.data
USER app
EXPOSE 3000
# Apply migrations, then start (the job worker starts inside the server).
CMD ["sh", "-c", "pnpm db:deploy && pnpm start"]
