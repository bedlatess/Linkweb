# LinkWeb Technical Whitepaper v2.0

> **Complete technical documentation for the LinkWeb Personal Link Aggregation Platform**  
> Based on: `LinkWeb_Architecture_Blueprint_v2.pdf` (4 pages, Chinese, PRD & Architecture Blueprint)  
> Generated: June 2026

---

## Table of Contents

| File | Title | Description |
|------|-------|-------------|
| [`01_executive_summary.md`](./01_executive_summary.md) | Executive Summary | Core vision, technical positioning, V1→V2 leap, target audience, reading guide |
| [`02_problem_statement.md`](./02_problem_statement.md) | Problem Statement | Five structural failures of commercial link aggregators, self-hosting impedance mismatch, LinkWeb's design-philosophy response |
| [`03_system_architecture.md`](./03_system_architecture.md) | System Architecture | Full-stack component decomposition, App Router pages, NextAuth.js integration, Prisma schema, middleware, Docker topology, API route design |
| [`04_protocol_and_mechanism.md`](./04_protocol_and_mechanism.md) | Protocol & Mechanism | OAuth 2.0 Authorization Code Grant with PKCE (7-step detailed flow), session management, API security model, encryption posture, privacy-preserving analytics, attack surface analysis |
| [`05_deployment_and_roadmap.md`](./05_deployment_and_roadmap.md) | Deployment & Roadmap | Docker Compose + manual Node.js deployment, OAuth app registration, CI/CD pipeline, three-phase roadmap (2026–2028), community governance, risk matrix |

---

## Quick Facts

| Dimension | Value |
|-----------|-------|
| **Project Name** | LinkWeb |
| **Version** | 2.0 |
| **Type** | Self-hosted Personal Link Aggregation Platform |
| **Core Stack** | Next.js 14+ · Tailwind CSS · shadcn/ui · Prisma · NextAuth.js v5 |
| **Database** | SQLite (default) / PostgreSQL (production) |
| **Authentication** | OAuth 2.0 (GitHub, Google) — passwordless |
| **Deployment** | Docker Compose (5 min) or manual Node.js |
| **License** | MIT (core) · CC-BY-SA 4.0 (docs) |
| **Inspiration** | LinkStackOrg/LinkStack (AGPL v3) |

---

## Attribution

This project builds upon architectural concepts from [LinkStackOrg/LinkStack](https://github.com/LinkStackOrg/LinkStack). Per the terms of the original AGPL v3 license and explicit permission from the original authors, LinkWeb is a fully rewritten codebase. Attribution is provided in documentation (README, about page, and this whitepaper) without requiring on-page attribution for deployed instances.

---

## Reading Paths

**For CTOs / Technical Decision Makers**:  
01 → 02 → 05 (skip 03/04 depth, read architecture diagrams only)

**For Security Auditors**:  
04 → 03 (API routes + middleware) → 05 (CI/CD pipeline)

**For Developers Contributing to LinkWeb**:  
03 → 04 → 05 (full read, in order)

**For Self-Hosters / Deployers**:  
05 → 01 → 03 (database schema + API routes for integration)

---

> All diagrams in this whitepaper are marked with `[图表：...]` placeholders. Vector illustration sources are available in the `/assets` directory of the main repository.