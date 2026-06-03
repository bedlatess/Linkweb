/**
 * NextAuth.js v5 API Route Handler
 *
 * This catch-all route handles all NextAuth.js endpoints:
 * - GET/POST /api/auth/signin
 * - GET/POST /api/auth/callback/{provider}
 * - GET/POST /api/auth/signout
 * - GET /api/auth/session
 * - GET /api/auth/csrf
 *
 * Reference: https://authjs.dev/getting-started/migrating-to-v5
 */

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;