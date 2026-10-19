# syntax=docker/dockerfile:1
# Old noghre.land Next.js web app. The admin panel lives inside it at /admin.
# NEXT_PUBLIC_* values are baked in at BUILD time. If they are missing the code
# falls back to https://noghre.land/api/v1 (the LIVE site), so the build refuses.
# docker build  --build-arg NEXT_PUBLIC_API_URL=https://oldnoghre-api.darkube.app/api/v1 \
#   --build-arg NEXT_PUBLIC_SITE_URL=https://oldnoghre.darkube.app -t old-frontend .
FROM node:22-bookworm-slim AS build
RUN corepack enable && corepack prepare pnpm@10.33.4 --activate
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=https://oldnoghre-api.darkube.app/api/v1
ARG NEXT_PUBLIC_SITE_URL=https://oldnoghre.darkube.app
ARG NEXT_PUBLIC_SOCKET_URL=https://oldnoghre-api.darkube.app
ARG NEXT_PUBLIC_PAYMENT_GATEWAY=zarinpal
RUN test -n "$NEXT_PUBLIC_API_URL" && test -n "$NEXT_PUBLIC_SITE_URL" \
 && case "$NEXT_PUBLIC_API_URL" in https://noghre.land*|https://www.noghre.land*) echo "NEXT_PUBLIC_API_URL must NOT be the live site" && exit 1;; esac \
 || { echo "Set build args NEXT_PUBLIC_API_URL and NEXT_PUBLIC_SITE_URL (legacy API, not noghre.land)"; exit 1; }
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_PAYMENT_GATEWAY=$NEXT_PUBLIC_PAYMENT_GATEWAY \
    NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN if [ -n "$NEXT_PUBLIC_SOCKET_URL" ]; then echo "NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL" > apps/web/.env.production; fi
RUN pnpm install --frozen-lockfile --filter "@noghre/web..."
RUN pnpm --filter @noghre/web build

FROM node:22-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends tini && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build --chown=node:node /app /app
WORKDIR /app/apps/web
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
USER node
EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000", "-H", "0.0.0.0"]
