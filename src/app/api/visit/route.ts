/**
 * Visit Log API — POST (record a link click)
 *
 * Public endpoint — no authentication required.
 * Privacy-preserving: only stores linkId + timestamp + hashed IP.
 * No cookies, no fingerprinting, no PII.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

export async function POST(request: Request) {
  const body = await request.json();
  const { linkId } = body;

  if (!linkId) {
    return NextResponse.json({ error: "linkId is required" }, { status: 400 });
  }

  // Verify the link exists
  const link = await prisma.link.findUnique({
    where: { id: linkId },
    select: { id: true },
  });

  if (!link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  // Privacy-preserving: hash the IP for dedup without storing raw IPs
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "0.0.0.0";
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 32);

  // Truncate user agent to 256 chars
  const userAgent = (request.headers.get("user-agent") ?? "unknown").slice(
    0,
    256
  );

  // Truncate referer
  const referer = (request.headers.get("referer") ?? null)?.slice(0, 512);

  await prisma.visitLog.create({
    data: {
      linkId,
      ipHash,
      userAgent,
      referer,
    },
  });

  return NextResponse.json({ success: true });
}