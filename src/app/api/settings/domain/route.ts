/**
 * Custom Domain Settings API — GET + PUT
 *
 * GET:  returns the current user's customDomain
 * PUT:  sets/updates the custom domain (with uniqueness check + format validation)
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Simple domain regex: allows subdomains, no protocol/path
const DOMAIN_REGEX =
  /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { customDomain: true },
  });

  return NextResponse.json({ customDomain: user?.customDomain ?? null });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { domain } = body;

  // ─── Clear domain ───
  if (!domain || domain === "") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { customDomain: null },
    });
    return NextResponse.json({ customDomain: null });
  }

  // ─── Validate format ───
  const cleanDomain = domain.trim().toLowerCase();
  if (!DOMAIN_REGEX.test(cleanDomain)) {
    return NextResponse.json(
      { error: "域名格式不正确，请输入如 link.example.com 的格式（不含协议）" },
      { status: 400 }
    );
  }

  // ─── Uniqueness check (exclude current user) ───
  const existing = await prisma.user.findUnique({
    where: { customDomain: cleanDomain },
    select: { id: true },
  });

  if (existing && existing.id !== session.user.id) {
    return NextResponse.json(
      { error: "该域名已被其他用户绑定，请使用其他域名" },
      { status: 409 }
    );
  }

  // ─── Update ───
  await prisma.user.update({
    where: { id: session.user.id },
    data: { customDomain: cleanDomain },
  });

  return NextResponse.json({ customDomain: cleanDomain });
}