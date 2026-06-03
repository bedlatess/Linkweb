# 04 — Protocol & Mechanism / 核心协议与通信机制

> **Focus Areas**: Authentication protocol (OAuth 2.0), session management, API security, encryption posture, privacy-preserving analytics design.

---

## 4.1 Authentication Protocol: OAuth 2.0 Authorization Code Grant

LinkWeb exclusively uses the **OAuth 2.0 Authorization Code Grant** flow (with optional PKCE for enhanced security). Password-based authentication has been intentionally removed from the architecture.

### 4.1.1 Why OAuth-Only?

| Concern | Password Auth | OAuth 2.0 (LinkWeb) |
|---------|--------------|---------------------|
| Credential storage | Server stores `password_hash` (breach liability) | Server stores only provider reference |
| Credential validation | Server validates password (CPU cost for hashing) | Deferred to provider (Google/GitHub) |
| MFA/2FA support | Must implement independently | Inherited from provider |
| Account recovery | Email reset flow required | Provider handles recovery |
| Account linking | Custom implementation | Native via `Account` table |
| Attack surface | Brute-force, credential stuffing, hash cracking | OAuth token theft only (mitigated by HTTPS + short-lived tokens) |

### 4.1.2 Protocol Flow (Detailed)

LinkWeb implements the standard [RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749) Authorization Code Grant, augmented with PKCE ([RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)) for public clients:

```
Step 1: Authorization Request
─────────────────────────────────────────────────────────────
Browser → LinkWeb: GET /api/auth/signin/github
LinkWeb → Browser: 302 Redirect to:
  https://github.com/login/oauth/authorize?
    client_id=GITHUB_CLIENT_ID
    &redirect_uri=https://linkweb.example.com/api/auth/callback/github
    &scope=read:user user:email
    &state=<random_base64_string>
    &code_challenge=<SHA256(code_verifier)>     ← PKCE
    &code_challenge_method=S256

Step 2: User Consent
─────────────────────────────────────────────────────────────
Browser → GitHub: User sees "LinkWeb would like to access..."
GitHub → Browser: 302 Redirect to:
  https://linkweb.example.com/api/auth/callback/github?
    code=<authorization_code>
    &state=<same_state>

Step 3: State Validation
─────────────────────────────────────────────────────────────
LinkWeb: Verify state parameter matches stored state → CSRF protection
If mismatch → 403 Forbidden

Step 4: Token Exchange (Server-to-Server)
─────────────────────────────────────────────────────────────
LinkWeb → GitHub: POST https://github.com/login/oauth/access_token
  Body: {
    client_id: GITHUB_CLIENT_ID,
    client_secret: GITHUB_SECRET,
    code: <authorization_code>,
    redirect_uri: <same_redirect_uri>,
    code_verifier: <original_verifier>     ← PKCE verification
  }
  Accept: application/json

GitHub → LinkWeb: {
    access_token: "gho_...",
    token_type: "bearer",
    scope: "read:user,user:email"
  }

Step 5: User Info Retrieval (Server-to-Server)
─────────────────────────────────────────────────────────────
LinkWeb → GitHub: GET https://api.github.com/user
  Authorization: Bearer gho_...

GitHub → LinkWeb: {
    id: 12345,
    login: "johndoe",
    name: "John Doe",
    email: "john@example.com",
    avatar_url: "https://..."
  }

Step 6: Database Synchronization
─────────────────────────────────────────────────────────────
LinkWeb (Prisma):
  User.upsert({
    where: { email },
    create: { name, email, image },
    update: { name, image }
  })
  Account.upsert({
    where: { provider_providerAccountId: { provider: "github", providerAccountId } },
    create: { userId, type: "oauth", provider, providerAccountId, access_token },
    update: { access_token }
  })

Step 7: Session Creation
─────────────────────────────────────────────────────────────
LinkWeb: Create session (JWT or database-backed)
LinkWeb → Browser: Set-Cookie: authjs.session-token=<encrypted>
LinkWeb → Browser: 302 Redirect to /dashboard
```

[图表：LinkWeb OAuth 2.0 + PKCE 完整授权码流程图 — 7 步骤详细标注]

---

## 4.2 Session Management

### 4.2.1 Session Strategies

NextAuth.js supports two session strategies. LinkWeb's default and recommendation:

| Strategy | Mechanism | Pros | Cons | LinkWeb Stance |
|----------|-----------|------|------|----------------|
| **JWT** (default) | Signed JWT in HttpOnly cookie | Stateless, no DB lookup per request | Cannot invalidate server-side without blocklist | **Recommended** for single-instance deployments |
| **Database** | Session row in DB, session ID in cookie | Server-side invalidation, multi-instance safe | Extra DB query per request | Use when deploying behind load balancer with PostgreSQL |

### 4.2.2 JWT Session Structure

```json
// Decoded JWT payload (example)
{
  "name": "John Doe",
  "email": "john@example.com",
  "picture": "https://avatars.githubusercontent.com/u/12345",
  "sub": "clx123abc0000xyz",       // User.id from database
  "iat": 1717300000,                // Issued at (Unix timestamp)
  "exp": 1717900000,                // Expiration (default: 30 days)
  "jti": "random-uuid-v4"           // JWT ID (for potential blocklisting)
}
```

**Security Properties**:

- **Signed, not encrypted**: The JWT payload is Base64-encoded and signed with `NEXTAUTH_SECRET` (HMAC-SHA256). The payload is readable by the client (if they decode the cookie) but **tamper-proof** — any modification invalidates the signature.
- **HttpOnly cookie**: The session token cookie is flagged `HttpOnly`, preventing JavaScript access via `document.cookie`. Combined with `SameSite=Lax`, this provides robust XSS protection.
- **Secure flag**: In production (`NODE_ENV=production`), the cookie is flagged `Secure`, ensuring transmission only over HTTPS.

### 4.2.3 Session Expiry and Refresh

```
Default JWT maxAge: 30 days

On each authenticated request:
  1. Middleware validates JWT signature against NEXTAUTH_SECRET
  2. If exp < now(): → redirect to /auth/signin
  3. If exp < now() + 7 days: → issue new JWT with refreshed exp
     (sliding expiration: active users never see a logout)

On token refresh failure (provider revoked access):
  → User redirected to sign-in with error=RefreshAccessTokenError
```

---

## 4.3 API Security Model

### 4.3.1 Authentication: NextAuth Middleware + Route Handlers

All protected API routes use a two-layer authentication check:

```typescript
// lib/auth-guard.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function withAuth(
  req: Request,
  handler: (req: Request, userId: string) => Promise<Response>
): Promise<Response> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  return handler(req, session.user.id);
}
```

**Usage in route handlers**:

```typescript
// app/api/links/route.ts
export const GET = (req: Request) =>
  withAuth(req, async (req, userId) => {
    const links = await prisma.link.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(links);
  });
```

### 4.3.2 Authorization: Ownership Validation

For resource-specific operations (PATCH `/api/links/[id]`), the handler validates that the authenticated user **owns the resource**:

```typescript
export const PATCH = (req: Request, { params }: { params: { id: string } }) =>
  withAuth(req, async (req, userId) => {
    const link = await prisma.link.findUnique({ where: { id: params.id } });

    if (!link || link.userId !== userId) {
      return NextResponse.json(
        { error: "Not found or forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updated = await prisma.link.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json(updated);
  });
```

### 4.3.3 CSRF Protection

NextAuth.js provides built-in CSRF protection for its own routes. For custom API routes, LinkWeb relies on two complementary mechanisms:

1. **SameSite=Lax cookies**: The session cookie is `SameSite=Lax` by default, which prevents the browser from sending the cookie on cross-origin POST requests initiated by third-party sites.
2. **Content-Type validation**: API routes that accept JSON enforce `Content-Type: application/json` — browsers cannot set this header on cross-origin `<form>` submissions without CORS preflight, providing a secondary CSRF barrier.

### 4.3.4 Rate Limiting

LinkWeb implements a lightweight in-memory rate limiter using `lru-cache`:

```
Default configuration:
  - /api/auth/* → 10 requests per 60 seconds per IP (brute-force protection on OAuth endpoints)
  - /api/links/* → 100 requests per 60 seconds per user (authenticated)
  - /api/visit    → 60 requests per 60 seconds per IP (click logging)
```

For production deployments behind a reverse proxy (nginx, Caddy, Traefik), rate limiting should be offloaded to the proxy layer, which can handle it more efficiently with tools like `fail2ban` integration.

---

## 4.4 Encryption Posture

### 4.4.1 Secrets Management

All sensitive values are injected via environment variables and are **never committed to source control**:

| Variable | Purpose | Rotation Frequency |
|----------|---------|-------------------|
| `NEXTAUTH_SECRET` | JWT signing key + cookie encryption | On compromise; otherwise static |
| `GITHUB_CLIENT_ID` | OAuth app identifier | Never (unless GitHub revokes) |
| `GITHUB_SECRET` | OAuth client secret | Quarterly (or on compromise) |
| `GOOGLE_CLIENT_ID` | OAuth app identifier | Never |
| `GOOGLE_SECRET` | OAuth client secret | Quarterly (or on compromise) |
| `DATABASE_URL` | Database connection string | On infrastructure change |

**`NEXTAUTH_SECRET` Generation**:

```bash
# Generate a cryptographically random 256-bit secret
openssl rand -base64 32
# or via Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4.4.2 Data at Rest

| Data | Storage | Encryption |
|------|---------|------------|
| User profile (name, email, bio) | SQLite/PostgreSQL | None at application layer; relies on filesystem/disk encryption |
| OAuth access tokens | `Account.access_token` column | None at application layer; NextAuth does not expose these via API |
| Session token (JWT) | Browser cookie | Signed with HMAC-SHA256 (`NEXTAUTH_SECRET`) |
| IP hashes (analytics) | `VisitLog.ipHash` | SHA-256 one-way hash |
| Uploaded assets | Docker volume (`/public/uploads`) | None at application layer |

**Rationale for application-layer encryption decisions**:

- OAuth tokens are **server-only** — they are never transmitted to the client, so application-layer encryption provides marginal benefit over disk encryption.
- IP hashing (SHA-256) is a **privacy design choice**, not a security control — it allows deduplication without storing raw IPs.
- For deployments requiring full data-at-rest encryption, LinkWeb recommends PostgreSQL with `pg_tde` or filesystem-level LUKS/dm-crypt.

### 4.4.3 Data in Transit

- **TLS 1.3**: Enforced in production via reverse proxy (nginx, Caddy, or Traefik) with automatic certificate renewal (Let's Encrypt / ACME).
- **HSTS**: Recommended `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` header.
- **Forward Secrecy**: TLS 1.3 mandates ephemeral Diffie-Hellman key exchange, ensuring that compromise of the server's private key does not compromise past sessions.

---

## 4.5 Privacy-Preserving Analytics Design

LinkWeb's `VisitLog` model is deliberately **minimal and privacy-respecting**:

### 4.5.1 What LinkWeb Does NOT Collect

| Not Collected | Rationale |
|---------------|-----------|
| Raw IP addresses | SHA-256 hashed; irreversibly anonymized |
| Browser fingerprinting (canvas, WebGL, fonts) | Never implemented; violates privacy-by-design |
| Third-party tracking scripts | No Google Analytics, no Facebook Pixel, no Hotjar |
| Cross-site tracking cookies | Single origin; no tracking across deployments |
| PII from visitors | No email collection, no name collection, no account creation |

### 4.5.2 What LinkWeb DOES Collect (and Why)

| Collected | Purpose | Retention |
|-----------|---------|-----------|
| IP hash (SHA-256) | Deduplicate unique visitors; prevent double-counting in analytics | 90 days (configurable) |
| User agent (truncated) | Device/browser analytics ("60% mobile, 40% desktop") | 90 days |
| Referer (optional) | Traffic source attribution | 90 days |
| Country (optional GeoIP) | Geographic distribution overview | 90 days |
| Click timestamp | Time-series analytics (daily/weekly trends) | 90 days |

### 4.5.3 GDPR Compliance Posture

As a **self-hosted application**, LinkWeb does not process data on behalf of a central entity. The deployer (the user who runs LinkWeb) is the **data controller**. LinkWeb provides the technical mechanisms for compliance:

- **Right of Access**: All `VisitLog` data is queryable via the Analytics API.
- **Right to Erasure**: `DELETE FROM VisitLog WHERE linkId IN (SELECT id FROM Link WHERE userId = ?)`.
- **Data Minimization**: Only four data points per visit; all hashed or truncated.
- **No Third-Party Subprocessors**: All data stays on the deployer's server.

---

## 4.6 Attack Surface Analysis

### 4.6.1 Threat Model

```
Threat Actor Profile: External attacker with no prior access
Attack Goal: Unauthorized access to admin dashboard or user data
Attack Vectors (ranked by risk):
```

| # | Vector | Risk | Mitigation |
|---|--------|------|------------|
| 1 | OAuth token theft via XSS | Medium | HttpOnly cookies; Content-Security-Policy header |
| 2 | CSRF on state-changing endpoints | Low | SameSite=Lax; NextAuth CSRF tokens |
| 3 | Session fixation | Low | NextAuth regenerates session on sign-in |
| 4 | Brute-force on sign-in page | Low | OAuth redirects to provider (rate-limited by GitHub/Google) |
| 5 | SQL injection | Very Low | Prisma parameterized queries (no raw SQL) |
| 6 | Path traversal on upload | Low | File names sanitized; stored in controlled directory |
| 7 | Dependency supply chain | Medium | `pnpm audit`; Dependabot/Renovate; lockfile integrity |
| 8 | SSRF via URL preview | Low | URL validation; no server-side fetch of user URLs |

### 4.6.2 Dependency Supply Chain Hardening

LinkWeb recommends:

```bash
# Regular dependency audit
pnpm audit

# Lockfile integrity verification
pnpm install --frozen-lockfile

# Automated dependency updates (GitHub Actions):
# - Dependabot: weekly security updates
# - Renovate: non-security updates grouped monthly
```

### 4.6.3 CSP Recommended Header

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://accounts.google.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https://avatars.githubusercontent.com https://lh3.googleusercontent.com;
  frame-src https://accounts.google.com;
  connect-src 'self';
  form-action 'self';
  base-uri 'self';
```

---

## 4.7 Future Protocol Extensions

### 4.7.1 Multi-Provider Account Linking

A user who signs in with GitHub should be able to **link** their Google account to the same LinkWeb profile. The `Account` table schema natively supports this — the UI and API route simply need to implement the "Link Account" flow:

```
User (id: "abc") 
  ├── Account (provider: "github", providerAccountId: "12345")
  └── Account (provider: "google", providerAccountId: "67890")
```

### 4.7.2 WebAuthn / Passkeys

For users who want authentication without any third-party provider, WebAuthn (FIDO2) support can be added as a NextAuth provider. This enables biometric-based authentication (fingerprint, Face ID, Windows Hello) with zero server-side credential storage — the public key is stored in the `Account` table.

### 4.7.3 API Key for Headless Access

For programmatic link management (CI/CD pipelines, IFTTT/Zapier integrations), an API key system can be bolted onto the existing middleware without architectural changes:

```
Authorization: Bearer lw_sk_xxxxxxxxxxxxxxxx
```

The key would be stored as a hashed value in a new `ApiKey` model, validated in the `withAuth` guard as an alternative to session-based auth.

---

> **Protocol Summary**: LinkWeb's security architecture is built on the principle of **delegated trust** — authentication is outsourced to battle-tested OAuth providers (GitHub, Google), session management is handled by a widely-audited library (NextAuth.js), and data access is mediated by a type-safe ORM (Prisma) that eliminates the most common vulnerability class in web applications (SQL injection). The result is a security posture that a solo developer can maintain without being a full-time security engineer.