/**
 * Single Link API — PATCH (update) + DELETE (delete)
 *
 * Ownership validation: only the link owner can modify or delete.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Ownership check
  const existing = await prisma.link.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Not found or forbidden" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const allowedFields: Record<string, unknown> = {};
  if (body.title !== undefined) allowedFields.title = body.title;
  if (body.url !== undefined) allowedFields.url = body.url;
  if (body.iconName !== undefined) allowedFields.iconName = body.iconName;
  if (body.isVisible !== undefined) allowedFields.isVisible = body.isVisible;
  if (body.groupName !== undefined) allowedFields.groupName = body.groupName;

  const updated = await prisma.link.update({
    where: { id },
    data: allowedFields,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Ownership check
  const existing = await prisma.link.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Not found or forbidden" },
      { status: 403 }
    );
  }

  await prisma.link.delete({ where: { id } });

  return NextResponse.json({ success: true });
}