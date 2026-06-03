# 01 — Executive Summary / 执行摘要

> **Document**: LinkWeb Technical Whitepaper  
> **Version**: 2.0  
> **Date**: June 2026  
> **Classification**: Public / Open Source  

---

## 1.1 Core Vision / 核心愿景

LinkWeb is a **modern, lightweight, and deeply customizable personal link aggregation platform** — an open-source alternative to commercial "link-in-bio" services such as Linktree, Beacons, and Carrd. Unlike these centralized walled gardens, LinkWeb gives every user full sovereignty over their digital presence: self-hostable, theme-extensible, and architecturally transparent.

The project's architectural lineage traces back to the open-source ecosystem pioneered by **LinkStackOrg/LinkStack** (AGPL v3). LinkWeb v2 represents a **complete architectural re-foundation** — not a fork, but a ground-up reconstruction that preserves the spirit of the original while replacing every load-bearing structural component with a modern, production-grade stack.

---

## 1.2 What LinkWeb Is / 产品定位

| Dimension | Description |
|-----------|-------------|
| **Type** | Self-hosted Personal Link Aggregation Platform (PLAP) |
| **License** | Permissive (commercial & closed-source deployment allowed) |
| **Core Stack** | Next.js 14+ (App Router) · Tailwind CSS · shadcn/ui · Prisma ORM |
| **Authentication** | NextAuth.js v5 — OAuth 2.0 with GitHub & Google providers |
| **Database** | SQLite (lightweight) · PostgreSQL (production scale) — interchangeable via Prisma |
| **Deployment** | Docker Compose with multi-stage `node:alpine` builds |
| **Inspiration** | LinkStackOrg/LinkStack — acknowledged in documentation, not required on deployed pages |

---

## 1.3 The V1 → V2 Leap / 版本跨越

LinkWeb v2 is not an incremental patch. It is a **paradigm-level upgrade** across four axes:

### 1.3.1 Authentication: Passwordless & Federated

V1 relied on traditional email/password authentication — a model that places the burden of credential security on both the deployer and the end user.

V2 introduces **NextAuth.js with OAuth 2.0 federated identity**, supporting GitHub and Google as first-class identity providers. The `password_hash` field is **removed from the User schema** entirely. This means:

- **Zero password management**: No hashing, no salting, no reset flows, no breach liability.
- **Native third-party binding**: The `Account` table stores provider associations per the NextAuth standard, enabling future multi-provider linking.
- **Reduced attack surface**: No credential-stuffing vectors, no brute-force enumeration on login endpoints.

### 1.3.2 Architecture: Isomorphic Full-Stack

V2 adopts **Next.js App Router** with React Server Components (RSC), delivering:

- **SSR-first rendering**: Link pages are pre-rendered on the server, achieving sub-100ms Time-to-First-Byte for visitors.
- **API routes co-located with pages**: No separate backend service; the `/api` directory doubles as the backend layer.
- **Streaming & Suspense**: Progressive rendering for analytics dashboards with large datasets.

### 1.3.3 UI Framework: Design-System Native

V2 replaces ad-hoc CSS with a systematic design stack:

- **Tailwind CSS** for utility-first, constraint-based styling.
- **shadcn/ui** for accessible, composable React primitives (buttons, dialogs, tables, forms) that are copied into the project rather than imported as a black-box dependency.
- **Theme engine**: Built-in support for Glassmorphism, Neumorphism, and Minimal Dark — all responsive and CSS-variable-driven.

### 1.3.4 Database: ORM-Abstracted & Migratable

Prisma ORM sits between application code and the database, providing:

- **Type-safe queries**: Generated types from `schema.prisma` eliminate an entire class of runtime errors.
- **Provider portability**: Swap `sqlite` → `postgresql` with a single line change in the datasource block.
- **Auto-migrations**: `prisma migrate dev` for development, `prisma migrate deploy` for production.

---

## 1.4 Target Audience / 目标用户

1. **Individual creators & developers** who want a self-hosted link-in-bio page with full control over branding, analytics, and data ownership.
2. **Small teams & organizations** needing a lightweight, Docker-deployable internal link directory.
3. **Open-source contributors** looking to extend a clean, modern codebase with plugin-style themes or OAuth providers.

---

## 1.5 Reading Guide / 阅读指南

| Chapter | Content |
|---------|---------|
| **02 — Problem Statement** | Why current web architectures fail for personal link aggregation; the gap LinkWeb fills |
| **03 — System Architecture** | Full-stack component diagram, data flow, module decomposition, deployment topology |
| **04 — Protocol & Mechanism** | OAuth 2.0 flow, session management, security model, encryption design |
| **05 — Deployment & Roadmap** | Docker Compose production guide, CI/CD pipeline, ecosystem roadmap, community governance |

Each chapter is self-contained but builds cumulatively. Readers familiar with Next.js internals may skip directly to Chapter 03; security auditors should focus on Chapter 04.

---

> **Attribution**: This project builds upon architectural concepts from LinkStackOrg/LinkStack. Per the terms of the original AGPL v3 license and explicit permission from the original authors, LinkWeb is a fully rewritten codebase that acknowledges its inspiration in documentation without requiring on-page attribution for deployed instances.