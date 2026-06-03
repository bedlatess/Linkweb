# 03 — System Architecture / 核心系统架构

> **Stack**: Next.js 14+ (App Router) · React 18+ · Tailwind CSS 3.4+ · shadcn/ui · Prisma ORM · NextAuth.js v5  
> **Database**: SQLite (default) / PostgreSQL (production)  
> **Package Manager**: pnpm (recommended) / npm  

---

## 3.1 Architectural Philosophy

LinkWeb follows a **monolithic isomorphic architecture** — a single Next.js application that serves both the frontend (React components) and backend (API routes, server actions, SSR) from one process. This is a deliberate rejection of microservice sprawl for a use case that does not justify it.

### Design Principles

1. **Co-location over separation**: API handlers live next to the pages they serve (`app/api/links/route.ts` adjacent to `app/dashboard/links/page.tsx`).
2. **Server-first rendering**: Every visitor-facing page is SSR'd. Client-side interactivity (drag-and-drop, theme preview) is layered as a progressive enhancement.
3. **ORM as abstraction boundary**: No raw SQL in application code. All data access flows through Prisma's type-safe client.
4. **Zero-config defaults**: Works out of the box with SQLite. Swapping to PostgreSQL requires changing one line in `.env` and `schema.prisma`.

---

## 3.2 High-Level System Topology

```
┌─────────────────────────────────────────────────────────────┐
│                     DOCKER HOST                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Next.js Server (node:alpine)              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │  App Router   │  │  API Routes  │  │  Middleware  │  │  │
│  │  │  (SSR / RSC)  │  │  (REST-like) │  │  (Auth guard)│  │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘  │  │
│  │         │                 │                  │         │  │
│  │         ▼                 ▼                  ▼         │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │              Prisma Client (Type-safe ORM)        │  │  │
│  │  └──────────────────┬───────────────────────────────┘  │  │
│  │                     │                                   │  │
│  └─────────────────────┼───────────────────────────────────┘  │
│                        │                                      │
│  ┌─────────────────────▼───────────────────────────────────┐  │
│  │              SQLite / PostgreSQL                         │  │
│  │              (Docker Volume: /data)                      │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │         Static Assets Volume (/public/uploads)           │  │
│  │         (User avatars, background images, favicons)      │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

[图表：LinkWeb 系统拓扑架构图 — Docker 单容器部署模式]

---

## 3.3 Module Decomposition

### 3.3.1 Frontend Layer: App Router Pages

```
app/
├── (public)/                    ← Public route group (no auth)
│   ├── layout.tsx               ← Public layout (fonts, metadata)
│   ├── page.tsx                 ← Landing page / marketing
│   └── [username]/              ← Dynamic user link page
│       ├── page.tsx             ← SSR: fetches user + links + theme
│       └── loading.tsx          ← Skeleton while SSR completes
│
├── (dashboard)/                 ← Protected route group (auth required)
│   ├── layout.tsx               ← Dashboard shell (sidebar, header)
│   ├── page.tsx                 ← Analytics overview ("数据大屏")
│   ├── links/
│   │   └── page.tsx             ← Link CRUD + drag-and-drop
│   ├── appearance/
│   │   └── page.tsx             ← Theme editor (bg, blur, button style)
│   └── settings/
│       └── page.tsx             ← SEO config, account settings
│
├── api/
│   ├── auth/
│   │   └── [...nextauth]/       ← NextAuth.js catch-all route
│   │       └── route.ts
│   ├── links/
│   │   ├── route.ts             ← GET (list), POST (create)
│   │   └── [id]/
│   │       └── route.ts         ← PATCH (update), DELETE, PATCH (reorder)
│   ├── theme/
│   │   └── route.ts             ← GET/PATCH theme config
│   └── analytics/
│       └── route.ts             ← GET visit stats (aggregated)
│
└── layout.tsx                   ← Root layout (providers, session)
```

### 3.3.2 Authentication Layer: NextAuth.js v5

```
lib/
└── auth.ts                      ← NextAuth configuration entry point
    ├── providers: [GitHub, Google]
    ├── adapter: PrismaAdapter(prisma)
    ├── session strategy: "jwt" or "database"
    ├── callbacks:
    │   ├── signIn()             ← Validate provider, link accounts
    │   ├── session()            ← Enrich session with user.id, role
    │   └── redirect()           ← Post-login destination routing
    └── pages:
        ├── signIn: "/auth/signin"
        └── error: "/auth/error"
```

**Authentication Flow**:

```
User Browser                    Next.js Server              OAuth Provider
    │                                │                           │
    │  GET /auth/signin              │                           │
    │ ──────────────────────────────►│                           │
    │                                │                           │
    │  Click "Sign in with GitHub"   │                           │
    │ ──────────────────────────────►│                           │
    │                                │  GET /api/auth/signin     │
    │                                │  (redirect to GitHub)     │
    │  ◄─────────────────────────────│                           │
    │                                │                           │
    │  ─────────────────────────────────────────────────────────►│
    │          Browser redirects to GitHub OAuth page            │
    │                                                             │
    │  Authorize app                                               │
    │  ◄─────────────────────────────────────────────────────────│
    │                                                             │
    │  GET /api/auth/callback?code=xxx&state=yyy                  │
    │ ──────────────────────────────►│                            │
    │                                │  POST /login/oauth/access_token
    │                                │ ──────────────────────────►│
    │                                │                            │
    │                                │  { access_token, user }    │
    │                                │ ◄──────────────────────────│
    │                                │                            │
    │                                │  Prisma: upsert User       │
    │                                │  Prisma: upsert Account    │
    │                                │                            │
    │  Set-Cookie: session_token     │                            │
    │  Redirect: /dashboard          │                            │
    │ ◄──────────────────────────────│                            │
```

[图表：LinkWeb OAuth 2.0 认证流程时序图 — Authorization Code Grant with PKCE]

### 3.3.3 Data Access Layer: Prisma ORM

```
prisma/
└── schema.prisma
    ├── datasource db              ← "sqlite" or "postgresql"
    ├── generator client           ← @prisma/client
    └── models:
        ├── User                   ← NextAuth required fields
        ├── Account                ← OAuth provider bindings
        ├── Session                ← (if database sessions)
        ├── VerificationToken      ← (if email verification)
        ├── Link                   ← Core business entity
        ├── ThemeConfig            ← Per-user appearance
        └── VisitLog               ← Privacy-respecting analytics
```

**Key Model Relations**:

```
User 1 ──── N Account       (One user, multiple OAuth providers)
User 1 ──── N Link           (One user, multiple links)
User 1 ──── 1 ThemeConfig    (One user, one theme config)
Link 1 ──── N VisitLog       (One link, many visit records)
```

### 3.3.4 State Management: Server State + Client State

LinkWeb distinguishes between two categories of state:

| State Category | Mechanism | Justification |
|----------------|-----------|---------------|
| **Server State** (links, theme, analytics) | React Server Components + `fetch()` in Server Components | Data lives on the server; no client-side cache invalidation to manage |
| **Client State** (UI interactions, drag-and-drop) | Zustand (lightweight, ~1KB) | Dnd-kit needs mutable state for drag operations; Zustand provides this without Redux boilerplate |

**Zustand Store Structure**:

```typescript
// stores/link-store.ts
interface LinkStore {
  links: Link[];
  setLinks: (links: Link[]) => void;
  reorderLinks: (fromIndex: number, toIndex: number) => void;
  updateLinkVisibility: (id: string, visible: boolean) => void;
}
```

---

## 3.4 Request Lifecycle: Full Page Load

```
1. Browser requests GET /johndoe
2. Next.js App Router matches [username]/page.tsx
3. Server Component executes:
   a. Prisma query: SELECT user WHERE username = 'johndoe'
   b. Prisma query: SELECT links WHERE user_id = X ORDER BY sort_order
   c. Prisma query: SELECT theme_config WHERE user_id = X
4. React Server Component renders HTML:
   a. Injects SEO metadata (<title>, <meta description>)
   b. Applies theme CSS variables (--bg-color, --blur-amount, etc.)
   c. Renders avatar, bio, link list with icons
5. HTML streamed to browser (with Suspense boundaries for async parts)
6. Browser hydrates: client-side JS attaches event handlers, animations
7. Theme renders: Glassmorphism / Neumorphism / Dark — all CSS-variable-driven
```

**Performance Budget** (target):

| Metric | Target |
|--------|--------|
| Time to First Byte (TTFB) | < 100ms (SSR cached) |
| First Contentful Paint (FCP) | < 500ms |
| Largest Contentful Paint (LCP) | < 1.0s |
| Total JavaScript (gzipped) | < 50KB (client-side) |

[图表：LinkWeb 页面请求完整生命周期流程图 — 从浏览器请求到 SSR 响应渲染]

---

## 3.5 Theme Engine Architecture

LinkWeb's theme system is **CSS-variable-driven** — themes are not separate stylesheets but dynamic variable assignments injected at render time.

```
ThemeConfig (DB)                    SSR Context                    CSS Output
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│ bg_type: "image" │────────►│ --bg-url: url(/x) │────────►│ background:       │
│ bg_value: "x.jpg"│         │ --bg-blur: 12px   │         │   var(--bg-url);  │
│ button_style:    │         │ --btn-radius: 8px │         │ backdrop-filter:  │
│   "rounded"      │         │ --btn-bg: #fff/10 │         │   blur(var(...)); │
└──────────────────┘         └──────────────────┘         └──────────────────┘
```

**Built-in Theme Presets**:

| Theme | Key CSS Characteristics |
|-------|------------------------|
| **Glassmorphism** | `backdrop-filter: blur(12px)`, semi-transparent backgrounds, subtle borders |
| **Neumorphism** | Soft box-shadows (light + dark), flat backgrounds, monochromatic palette |
| **Minimal Dark** | `#0a0a0a` background, high-contrast text, minimal borders, geometric icons |

Custom themes are user-defined via the Appearance dashboard and persisted as JSON in `ThemeConfig.bg_value`.

---

## 3.6 Database Schema (Full Reference)

```
// prisma/schema.prisma

datasource db {
  provider = "sqlite"    // or "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  bio           String?
  username      String?   @unique
  accounts      Account[]
  links         Link[]
  themeConfig   ThemeConfig?
  sessions      Session[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Link {
  id         String     @id @default(cuid())
  userId     String
  title      String
  url        String
  iconName   String?    // Lucide icon identifier
  isVisible  Boolean    @default(true)
  sortOrder  Int        @default(0)
  groupName  String?    // Optional grouping label
  visitLogs  VisitLog[]
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  @@index([userId, sortOrder])
}

model ThemeConfig {
  id          String   @id @default(cuid())
  userId      String   @unique
  bgType      String   @default("color")  // "color" | "image" | "gradient"
  bgValue     String   @default("#0a0a0a") // hex color, image path, or gradient CSS
  bgBlur      Int      @default(0)        // px value for backdrop-filter
  buttonStyle String   @default("rounded") // "rounded" | "pill" | "square"
  fontFamily  String?                     // Google Font name or system stack
  customCSS   String?                     // Raw CSS override (escape hatch)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  updatedAt   DateTime @updatedAt
}

model VisitLog {
  id         String   @id @default(cuid())
  linkId     String
  ipHash     String   // SHA-256 hash of visitor IP (privacy-preserving)
  userAgent  String   // Truncated to 256 chars
  referer    String?  // Optional, truncated
  country    String?  // GeoIP lookup result (optional)
  link       Link     @relation(fields: [linkId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())

  @@index([linkId, createdAt])
}
```

---

## 3.7 API Route Design

LinkWeb's API follows a **resource-oriented REST-ish** pattern, but within the Next.js paradigm of file-based routing:

### 3.7.1 Link Management Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/links` | ✅ | List all links for authenticated user, ordered by `sortOrder` |
| `POST` | `/api/links` | ✅ | Create new link; auto-assigns `sortOrder = max(sortOrder) + 1` |
| `PATCH` | `/api/links/[id]` | ✅ | Update link fields (title, url, icon, visibility) |
| `DELETE` | `/api/links/[id]` | ✅ | Delete link and cascade-delete its VisitLog entries |
| `PATCH` | `/api/links/reorder` | ✅ | Accepts `[{id, sortOrder}]` array; batch-updates order (drag-and-drop persistence) |

### 3.7.2 Theme Endpoint

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/theme` | ✅ | Get current user's theme config |
| `PATCH` | `/api/theme` | ✅ | Update theme fields; returns updated config |

### 3.7.3 Public Endpoints (No Auth)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/user/[username]` | ❌ | Public user profile + links + theme (used by SSR page) |
| `POST` | `/api/visit` | ❌ | Log a link click (called from client-side on click) |

### 3.7.4 Analytics Endpoint

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/analytics` | ✅ | Aggregated stats: total visits, per-link counts, daily breakdown (last 30 days), top referrers, device breakdown |

---

## 3.8 Middleware Layer

Next.js middleware (`middleware.ts` at project root) serves as the **authentication gate**:

```typescript
// middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAuth = !!req.auth;
  const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard");
  const isApiAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");

  // Allow auth API routes to pass through (NextAuth handles its own routing)
  if (isApiAuthRoute) return NextResponse.next();

  // Redirect unauthenticated dashboard access to sign-in
  if (isDashboardRoute && !isAuth) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/((?!auth|user|visit).)*"],
};
```

---

## 3.9 Containerization Architecture

### Docker Multi-Stage Build

```
Stage 1: deps
  FROM node:20-alpine
  COPY package.json pnpm-lock.yaml ./
  RUN corepack enable && pnpm install --frozen-lockfile

Stage 2: builder
  FROM node:20-alpine
  COPY --from=deps node_modules ./node_modules
  COPY . .
  RUN pnpm build

Stage 3: runner
  FROM node:20-alpine
  COPY --from=builder .next/standalone ./
  COPY --from=builder .next/static ./.next/static
  COPY --from=builder public ./public
  EXPOSE 3000
  CMD ["node", "server.js"]
```

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: "3.8"
services:
  linkweb:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    volumes:
      - linkweb-data:/app/data       # SQLite database file
      - linkweb-uploads:/app/public/uploads  # User-uploaded assets
    restart: unless-stopped

volumes:
  linkweb-data:
  linkweb-uploads:
```

[图表：LinkWeb Docker 多阶段构建与 Compose 部署拓扑图]

---

> **Architectural Summary**: LinkWeb achieves production-grade capability with a single-process architecture — SSR for performance, OAuth for security, Prisma for data integrity, and Docker for deployment reproducibility. The architecture is deliberately minimal: no Redis, no message queue, no separate API server. For 99% of use cases (personal link pages serving < 10,000 visits/day), this is not just sufficient — it is optimal.