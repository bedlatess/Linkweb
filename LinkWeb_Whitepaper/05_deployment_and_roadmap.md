# 05 — Deployment & Roadmap / 部署方案与演进路线

> **Objective**: Define the path from a developer's laptop to a globally available production deployment, and chart the long-term evolution of the LinkWeb ecosystem.

---

## 5.1 Deployment Philosophy

LinkWeb is designed for **three deployment tiers**, each optimized for a different user persona:

| Tier | User Persona | Infrastructure | Setup Time |
|------|-------------|----------------|------------|
| **Tier 1: Docker Compose** | Solo creator, homelab enthusiast | Single VPS / Raspberry Pi / NAS | < 5 minutes |
| **Tier 2: Manual Node.js** | Developer who wants full control | Any Linux server with Node.js 20+ | < 15 minutes |
| **Tier 3: Cloud-Native (Future)** | Teams, multi-tenant SaaS operators | Kubernetes, managed PostgreSQL, S3 | Roadmap |

This chapter covers Tier 1 and Tier 2 in production-ready detail; Tier 3 is outlined in the roadmap.

---

## 5.2 Tier 1: Docker Compose (Recommended Default)

### 5.2.1 Prerequisites

- **Host**: Linux server (Ubuntu 22.04+ recommended), 1 vCPU, 512MB RAM minimum
- **Software**: Docker Engine 24+ and Docker Compose v2+
- **Domain**: A domain name with DNS A record pointing to the server IP
- **OAuth Apps**: Registered GitHub OAuth App and Google OAuth 2.0 Client

### 5.2.2 OAuth App Registration

#### GitHub OAuth App

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
2. Configure:
   - **Application name**: `LinkWeb` (or your instance name)
   - **Homepage URL**: `https://links.yourdomain.com`
   - **Authorization callback URL**: `https://links.yourdomain.com/api/auth/callback/github`
3. Generate a **Client Secret**
4. Record `GITHUB_CLIENT_ID` and `GITHUB_SECRET`

#### Google OAuth 2.0 Client

1. Go to **Google Cloud Console → APIs & Services → Credentials → Create Credentials → OAuth client ID**
2. Configure:
   - **Application type**: Web application
   - **Authorized redirect URIs**: `https://links.yourdomain.com/api/auth/callback/google`
3. Record `GOOGLE_CLIENT_ID` and `GOOGLE_SECRET`

### 5.2.3 Environment Configuration

Create `.env` in the project root:

```bash
# .env — LinkWeb Production Configuration

# === Database ===
# SQLite (default, zero-config)
DATABASE_URL="file:./data/linkweb.db"

# PostgreSQL (for multi-instance or high-traffic deployments)
# DATABASE_URL="postgresql://user:password@host:5432/linkweb"

# === NextAuth ===
NEXTAUTH_URL="https://links.yourdomain.com"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"   # Generate once, never rotate without reason

# === OAuth Providers ===
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_SECRET="your_github_client_secret"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_SECRET="your_google_client_secret"

# === Optional ===
# NEXT_PUBLIC_APP_NAME="LinkWeb"               # Branding override
# ANALYTICS_RETENTION_DAYS=90                   # VisitLog auto-cleanup
# UPLOAD_MAX_SIZE_MB=5                          # Avatar/image upload limit
```

### 5.2.4 Deployment Commands

```bash
# 1. Clone the repository
git clone https://github.com/your-org/linkweb.git
cd linkweb

# 2. Create and configure .env
cp .env.example .env
nano .env   # Fill in OAuth credentials and NEXTAUTH_SECRET

# 3. Build and start
docker compose up -d --build

# 4. Verify
docker compose logs -f    # Watch for "Ready in Xms" message
curl -I https://links.yourdomain.com   # Check for HTTP 200

# 5. First-time setup
# Visit https://links.yourdomain.com/auth/signin
# Sign in with GitHub or Google
# You are now the admin — configure your links and theme
```

### 5.2.5 Production Hardening Checklist

- [ ] **Firewall**: Only ports 80 and 443 exposed; SSH on non-default port with key-only auth
- [ ] **TLS/SSL**: Caddy or nginx reverse proxy with Let's Encrypt auto-renewal
- [ ] **Backups**: Daily cron job backing up the Docker volume:
  ```bash
  # /etc/cron.daily/linkweb-backup
  #!/bin/bash
  tar -czf /backups/linkweb-$(date +%Y%m%d).tar.gz \
    /var/lib/docker/volumes/linkweb_linkweb-data/_data/
  find /backups/linkweb-*.tar.gz -mtime +30 -delete
  ```
- [ ] **Monitoring**: Uptime Kuma or Healthchecks.io ping on `/api/health`
- [ ] **Log rotation**: Docker's `max-size` and `max-file` log options configured
- [ ] **Updates**: Watch GitHub releases; `docker compose pull && docker compose up -d`

### 5.2.6 Reverse Proxy Configuration (Caddy)

```caddyfile
# Caddyfile — Simplest production reverse proxy
links.yourdomain.com {
    reverse_proxy localhost:3000

    header {
        Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}
```

[图表：LinkWeb Docker Compose 生产部署拓扑图 — VPS + Caddy + Let's Encrypt]

---

## 5.3 Tier 2: Manual Node.js Deployment

For developers who prefer direct process management or need to integrate with existing infrastructure (systemd, PM2, etc.):

### 5.3.1 Prerequisites

- Node.js 20 LTS
- pnpm (activated via `corepack enable`)
- SQLite (built into most Linux distributions) or PostgreSQL

### 5.3.2 Installation

```bash
# 1. Clone and install
git clone https://github.com/your-org/linkweb.git
cd linkweb
cp .env.example .env
nano .env

# 2. Install dependencies
corepack enable
pnpm install --frozen-lockfile

# 3. Generate Prisma client and run migrations
pnpm prisma generate
pnpm prisma migrate deploy

# 4. Build
pnpm build

# 5. Start (standalone mode — Next.js output: 'standalone')
node .next/standalone/server.js
```

### 5.3.3 systemd Service Unit

```ini
# /etc/systemd/system/linkweb.service
[Unit]
Description=LinkWeb - Personal Link Aggregation Platform
After=network.target

[Service]
Type=simple
User=linkweb
WorkingDirectory=/opt/linkweb
EnvironmentFile=/opt/linkweb/.env
ExecStart=/usr/bin/node /opt/linkweb/.next/standalone/server.js
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=linkweb

# Security hardening
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/opt/linkweb/data /opt/linkweb/public/uploads

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now linkweb
sudo systemctl status linkweb
```

---

## 5.4 CI/CD Pipeline

LinkWeb uses GitHub Actions for automated testing, building, and Docker image publication:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: linkweb_test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm prisma generate
      - run: pnpm test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/linkweb_test

  docker:
    needs: [lint-and-typecheck, test]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/your-org/linkweb:latest, ghcr.io/your-org/linkweb:${{ github.sha }}
```

---

## 5.5 Ecosystem Roadmap / 演进路线图

### 5.5.1 Phase 1: Core Stabilization (Q3 2026) — Current Focus

| Milestone | Status | Description |
|-----------|--------|-------------|
| v2.0.0 Release | 🎯 Target | Complete V2 architecture with all core features documented in this whitepaper |
| SQLite → PostgreSQL Migration Guide | 📋 Planned | Documented procedure with `pg_dump`-equivalent for Prisma |
| Theme Marketplace Structure | 📋 Planned | Directory convention for community-contributed themes |
| E2E Testing Suite | 📋 Planned | Playwright tests covering: auth flow, link CRUD, drag-and-drop, theme switching |
| i18n Framework | 📋 Planned | `next-intl` integration for multi-language UI (Chinese, Japanese, Spanish first) |

### 5.5.2 Phase 2: Ecosystem Growth (Q4 2026 – Q1 2027)

| Milestone | Description |
|-----------|-------------|
| **Plugin API v0.1** | Webhook-based plugin system: `onVisit`, `onLinkCreate`, `onThemeChange` — enables integration with Telegram, Discord, Slack for real-time notifications |
| **Community Theme Registry** | GitHub-based theme submission with automated screenshot generation (Puppeteer) and compatibility validation |
| **Multi-User Mode** | Optional mode where one deployment serves multiple independent user pages (`/[username]` routing already supports this structurally) |
| **Analytics Export** | CSV/JSON export; optional webhook streaming to external analytics platforms (Plausible, Umami, Matomo) |
| **WebAuthn Provider** | Passkey-based passwordless authentication as an alternative to OAuth providers |
| **ARM64 Native Image** | Multi-arch Docker builds (amd64 + arm64) for Raspberry Pi 4/5 and Apple Silicon servers |

### 5.5.3 Phase 3: Platform Maturity (Q2 2027 – Q4 2027)

| Milestone | Description |
|-----------|-------------|
| **Tier 3: Kubernetes Helm Chart** | Production-grade Helm chart with: horizontal pod autoscaling, PostgreSQL operator integration, Redis for session store, S3-compatible object storage for uploads, ingress with cert-manager |
| **Federated LinkWeb Protocol** | Allow LinkWeb instances to optionally federate: a visitor on Instance A can see links curated by Instance B (ActivityPub-adjacent, not a full implementation) |
| **Headless CMS Mode** | Expose link data via GraphQL (using `graphql-yoga` on a Next.js route) for integration with static site generators (Astro, Hugo, 11ty) |
| **CLI Management Tool** | `npx linkweb-cli` — manage links, themes, and analytics from terminal; useful for CI/CD pipelines and automation |
| **Official Managed Hosting** | Optional paid hosting service (EU-based, GDPR-compliant) for users who want LinkWeb without self-hosting — revenue funds core development |

### 5.5.4 Long-Term Vision (2028+)

- **Decentralized Identity**: DID (Decentralized Identifiers) as an auth provider — sign in with your own domain
- **Edge-Native Rendering**: Deploy link pages to Cloudflare Workers / Vercel Edge Functions for global <50ms TTFB
- **AI-Powered Link Optimization**: On-device ML for link ordering suggestions based on visitor behavior patterns (privacy-preserving, local-only)

---

## 5.6 Community Governance

LinkWeb is an **open-source project with a BDFL (Benevolent Dictator For Life) model** during Phases 1–2, transitioning to a **Technical Steering Committee (TSC)** in Phase 3.

### Contribution Guidelines

```
1. Issue first, PR second — discuss before coding
2. PRs must pass: lint → typecheck → test → e2e (if applicable)
3. Architectural changes require an RFC (Request for Comments) in Discussions
4. Community themes follow THEME_SPEC.md convention
5. Attribution: All derivative works must credit LinkStackOrg/LinkStack
   in documentation (not required on deployed pages)
```

### Licensing

| Component | License | Notes |
|-----------|---------|-------|
| LinkWeb Core | MIT | Permissive: commercial use, modification, private use, distribution |
| Community Themes | CC-BY 4.0 or MIT (author's choice) | Attribution to theme author required |
| Documentation | CC-BY-SA 4.0 | This whitepaper and all `/docs` content |
| Docker Images | MIT | Same as core |
| Attribution | AGPL v3 spirit | LinkStackOrg/LinkStack credited in README, about page, and docs |

---

## 5.7 Success Metrics (Internal KPIs)

| Metric | Phase 1 Target | Phase 2 Target | Phase 3 Target |
|--------|---------------|---------------|---------------|
| GitHub Stars | 500 | 2,000 | 5,000 |
| Docker Hub Pulls | 1,000 | 10,000 | 50,000 |
| Active Contributors | 5 | 20 | 50 |
| Community Themes | 10 | 50 | 200 |
| Production Deployments (self-reported) | 100 | 1,000 | 10,000 |
| Average Time-to-Deploy | < 10 min | < 5 min | < 2 min (1-click) |

---

## 5.8 Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-----------|--------|------------|
| NextAuth.js v5 API instability (beta period) | Medium | High | Pin specific version; maintain integration test suite; monitor release notes |
| OAuth provider API deprecation (GitHub/Google) | Low | High | NextAuth provider abstraction layer; quick provider swaps |
| SQLite concurrency limits under unexpected load | Low | Medium | Documented migration path to PostgreSQL; connection pooling with `pgbouncer` |
| Contributor burnout (small team) | Medium | High | Clear scope boundaries; "no" is an acceptable answer; paid hosting revenue funds maintainers |
| Supply chain attack via npm dependency | Low | Critical | `pnpm audit`; Dependabot; lockfile pinning; periodic dependency review |

---

> **Deployment Summary**: LinkWeb can go from `git clone` to production in under 5 minutes with Docker Compose. For developers wanting full control, the manual Node.js path provides systemd integration and security hardening. The three-phase roadmap extends this foundation from a solo-developer tool to a mature platform with Kubernetes support, federated instances, and an ecosystem of community themes — all while maintaining the core promise: **your links, your server, your data**.