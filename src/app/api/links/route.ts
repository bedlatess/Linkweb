/**
 * Links API — GET (list) + POST (create)
 *
 * All routes require authentication (enforced by proxy.ts middleware).
 * GET returns all links for the authenticated user, ordered by sortOrder.
 * POST creates a new link with auto-assigned sortOrder.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const links = await prisma.link.findMany({
    where: { userId: session.user.id },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(links);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, url, iconName, isVisible, groupName } = body;

  if (!title || !url) {
    return NextResponse.json(
      { error: "Title and URL are required" },
      { status: 400 }
    );
  }

  // Auto-assign sortOrder: max(sortOrder) + 1
  const lastLink = await prisma.link.findFirst({
    where: { userId: session.user.id },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const sortOrder = (lastLink?.sortOrder ?? -1) + 1;

  const link = await prisma.link.create({
    data: {
      userId: session.user.id,
      title,
      url,
      iconName: iconName ?? null,
      isVisible: isVisible ?? true,
      sortOrder,
      groupName: groupName ?? null,
    },
  });

  return NextResponse.json(link, { status: 201 });
}