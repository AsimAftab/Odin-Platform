# Multi-stage build for a self-hosted Odin Platform.
#   docker build -t odin-platform .
#   docker compose up   (see docker-compose.yml for the app + MongoDB pair)

# ---- deps + build (Bun) ----
FROM oven/bun:1.3-alpine AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Dummy values so build-time imports (lib/db.ts, lib/auth.ts) don't throw.
# No database is contacted during `next build`; real values come at runtime.
ENV MONGODB_URI=mongodb://build-placeholder:27017/odin \
    BETTER_AUTH_SECRET=0000000000000000000000000000000000000000000000000000000000000000 \
    BETTER_AUTH_URL=http://localhost:3000 \
    NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# ---- runtime (Node, standalone output) ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S odin && adduser -S odin -G odin

COPY --from=build --chown=odin:odin /app/.next/standalone ./
COPY --from=build --chown=odin:odin /app/.next/static ./.next/static
COPY --from=build --chown=odin:odin /app/public ./public

USER odin
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
