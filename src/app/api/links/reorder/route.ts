/**
 * Links Reorder API — PATCH (batch reorder)
 *
 * Accepts an array of { id, sortOrder } and updates all in a transaction.
 * This is called after drag-and-drop reordering.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { items } = body as {
    items: { id: string; sortOrder: number }[];
  };

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "items array is required" },
      { status: 400 }
    );
  }

  // Batch update in a transaction for atomicity
  await prisma.$transaction(
    items.map(({ id, sortOrder }) =>
      prisma.link.updateMany({
        where: { id, userId: session.user!.id! },
        data: { sortOrder },
      })
    )
  );

  return NextResponse.json({ success: true });
}