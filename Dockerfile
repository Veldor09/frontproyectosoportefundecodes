# syntax=docker/dockerfile:1.7

# ============================================================
#  Frontend Next.js 15 — Fundecodes Digital
#  Build multi-stage con output: "standalone" (imagen mínima ~200 MB).
#  Pensado para Dokploy / Docker Compose / Kubernetes.
# ============================================================

# ---------- Stage 1: deps ----------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Sólo manifiestos primero → mejor caché de capa (no se reinstala todo si solo cambia el código).
COPY package.json package-lock.json* ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm ci --no-audit --no-fund

# ---------- Stage 2: build ----------
FROM node:20-alpine AS build
RUN apk add --no-cache libc6-compat
WORKDIR /app

# NEXT_PUBLIC_* se "hornean" en el bundle del cliente, por eso se pasan como ARG
# en build time. Si el ARG no se pasa, el next.config.ts cae al fallback
# http://localhost:4000 (lo cual rompe la app en producción) — Dokploy DEBE pasar
# el valor real desde "Build Arguments".
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ---------- Stage 3: runtime ----------
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat tini wget
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Usuario no-root
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Salida standalone + estáticos + public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

# Healthcheck contra /api/health (route handler dedicado, ligero, JSON 200).
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:3000/api/health | grep -q '"ok":true' || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
