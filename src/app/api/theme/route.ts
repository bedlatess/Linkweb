/**
 * Theme API — GET (fetch) + PUT (upsert)
 *
 * GET returns the current user's ThemeConfig.
 * PUT upserts (create if not exists, update if exists) the ThemeConfig.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await prisma.themeConfig.findUnique({
    where: { userId: session.user.id },
  });

  // Return defaults if no config exists yet
  if (!config) {
    return NextResponse.json({
      bgType: "color",
      bgValue: "#0a0a0a",
      bgBlur: 0,
      buttonStyle: "rounded",
      fontFamily: null,
      tipEnabled: false,
      tipTitle: null,
      paypalEmail: null,
      customTipUrl: null,
      cryptoAddress: null,
    });
  }

  return NextResponse.json(config);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const allowedFields: Record<string, unknown> = {};

  if (body.bgType !== undefined) allowedFields.bgType = body.bgType;
  if (body.bgValue !== undefined) allowedFields.bgValue = body.bgValue;
  if (body.bgBlur !== undefined) allowedFields.bgBlur = body.bgBlur;
  if (body.buttonStyle !== undefined) allowedFields.buttonStyle = body.buttonStyle;
  if (body.fontFamily !== undefined) allowedFields.fontFamily = body.fontFamily;
  // Tip fields
  if (body.tipEnabled !== undefined) allowedFields.tipEnabled = body.tipEnabled;
  if (body.tipTitle !== undefined) allowedFields.tipTitle = body.tipTitle;
  if (body.paypalEmail !== undefined) allowedFields.paypalEmail = body.paypalEmail;
  if (body.customTipUrl !== undefined) allowedFields.customTipUrl = body.customTipUrl;
  if (body.cryptoAddress !== undefined) allowedFields.cryptoAddress = body.cryptoAddress;

  const config = await prisma.themeConfig.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ...allowedFields,
    },
    update: allowedFields,
  });

  return NextResponse.json(config);
}