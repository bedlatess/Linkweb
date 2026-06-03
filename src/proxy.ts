/**
 * LinkWeb Route Guard Proxy (Next.js 16+)
 *
 * Two responsibilities:
 *   1. Auth guard: protect /dashboard/* and sensitive API routes
 *   2. Custom domain rewrite: if the request host is not the main site,
 *      look up the user by customDomain and rewrite to /[username]
 *
 * In Next.js 16, the `middleware.ts` convention is replaced by `proxy.ts`.
 */

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Create a standalone Prisma client for the proxy (Edge-compatible)
// In production this would be a cached singleton, but for SQLite we keep it simple
const getPrisma = (() => {
  let instance: PrismaClient | null = null;
  return () => {
    if (!instance) instance = new PrismaClient();
    return instance;
  };
})();

export default auth(async (req) => {
  const isAuthenticated = !!req.auth;
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") ?? "";
  const mainHost = process.env.NEXTAUTH_URL
    ? new URL(process.env.NEXTAUTH_URL).host
    : "localhost:3010";

  // ═══════════════════════════════════════════════════════════════
  //  Custom Domain Rewrite (White-label)
  // ═══════════════════════════════════════════════════════════════
  if (host !== mainHost && !host.startsWith("localhost")) {
    // Only rewrite the root path for custom domains (not /api, /auth, etc.)
    if (pathname === "/" || pathname === "") {
      try {
        const prisma = getPrisma();
        const user = await prisma.user.findUnique({
          where: { customDomain: host },
          select: { username: true },
        });

        if (user?.username) {
          // Rewrite: serve the user's public page at the custom domain root
          const rewriteUrl = new URL(`/${user.username}`, req.url);
          return NextResponse.rewrite(rewriteUrl);
        }
      } catch {
        // DB lookup failed — fall through to normal routing
      }
    }
    // For non-root paths on custom domains, also try to rewrite
    // (e.g. customdomain.com → /username)
    if (pathname === "/") {
      try {
        const prisma = getPrisma();
        const user = await prisma.user.findUnique({
          where: { customDomain: host },
          select: { username: true },
        });
        if (user?.username) {
          return NextResponse.rewrite(new URL(`/${user.username}`, req.url));
        }
      } catch {
        // fall through
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  Auth Guard
  // ═══════════════════════════════════════════════════════════════

  // Allow auth-related pages, NextAuth API routes, and register route
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Protect /dashboard and all sub-routes
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      const signInUrl = new URL("/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Protect API routes — return 401 JSON instead of redirect
  if (
    pathname.startsWith("/api/links") ||
    pathname.startsWith("/api/theme") ||
    pathname.startsWith("/api/analytics") ||
    pathname.startsWith("/api/settings")
  ) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
});

/**
 * Route matcher: run the proxy on ALL routes (needed for custom domain detection).
 * Auth guards are applied selectively within the handler.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};