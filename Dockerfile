# ── Stage 1: build the frontend ──────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Production build talks to the same origin (PocketBase serves it), so no PB URL.
ENV VITE_PB_URL=""
RUN npm run build

# ── Stage 2: runtime (PocketBase serving the app + API) ──────
FROM alpine:3.20
ARG PB_VERSION=0.38.2
RUN apk add --no-cache ca-certificates unzip wget
WORKDIR /pb

# PocketBase binary (matches the local dev version)
RUN wget -q https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip \
  && unzip pocketbase_${PB_VERSION}_linux_amd64.zip \
  && rm pocketbase_${PB_VERSION}_linux_amd64.zip

# Schema migrations, server-side hooks (AI scan proxy), and the built site
COPY pocketbase/pb_migrations ./pb_migrations
COPY pocketbase/pb_hooks ./pb_hooks
COPY --from=build /app/dist ./pb_public
COPY docker-entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# pb_data (SQLite + uploaded photos) persists via a Railway Volume mounted at
# /pb/pb_data (added in the Railway UI). Railway rejects a Dockerfile VOLUME line,
# so we don't declare one here.
EXPOSE 8090
ENTRYPOINT ["./entrypoint.sh"]
