# ╔══════════════════════════════════════════════════════════════════╗
# ║  LinkWeb — Multi-stage Production Dockerfile                     ║
# ║                                                                  ║
# ║  Stage 1 (deps):    Install ALL dependencies (incl. devDeps)     ║
# ║  Stage 2 (builder): Build Next.js + generate Prisma client       ║
# ║  Stage 3 (runner):  Standalone output only (~200MB)              ║
# ║                                                                  ║
# ║  Target: node:20-alpine                                          ║
# ╚══════════════════════════════════════════════════════════════════╝

# ─── Stage 1: Dependencies (ALL deps needed for build) ─────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies — Tailwind v4 postcss plugin is required
# at build time to compile globals.css. We install everything here
# because the builder stage needs TypeScript, ESLint, and Tailwind.
RUN npm ci --ignore-scripts

# ─── Stage 2: Builder ───────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy all deps from stage 1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js (output: standalone)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─── Stage 3: Runner (standalone only — no node_modules bloat) ─────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output — Next.js bundles all runtime deps here
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma artifacts for runtime migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

EXPOSE 3010

ENV PORT=3010
ENV HOSTNAME=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3010/api/auth/signin || exit 1

CMD ["node", "server.js"]