/**
 * Analytics API — GET
 *
 * Returns aggregated analytics for the authenticated user:
 *   - totalViews: total visits in the past 7 days
 *   - dailyViews: day-by-day breakdown for the past 7 days
 *   - topLinks: top 5 links by click count
 *   - activeLinks: count of visible links
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // ─── Date range: past 7 days ───
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // ─── 1. Total views in past 7 days ───
  const totalViewsResult = await prisma.visitLog.count({
    where: {
      link: { userId },
      createdAt: { gte: sevenDaysAgo },
    },
  });

  // ─── 2. Daily breakdown (groupBy day) ───
  const rawDaily = await prisma.visitLog.findMany({
    where: {
      link: { userId },
      createdAt: { gte: sevenDaysAgo },
    },
    select: { createdAt: true },
  });

  // Build a 7-day map with zero-fill
  const dailyMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10); // "2026-06-02"
    dailyMap[key] = 0;
  }

  // Count visits per day
  for (const row of rawDaily) {
    const key = row.createdAt.toISOString().slice(0, 10);
    if (dailyMap[key] !== undefined) {
      dailyMap[key]++;
    }
  }

  const dailyViews = Object.entries(dailyMap).map(([date, count]) => ({
    date,
    count,
  }));

  // ─── 3. Top 5 links by click count ───
  const topLinksRaw = await prisma.visitLog.groupBy({
    by: ["linkId"],
    where: {
      link: { userId },
      createdAt: { gte: sevenDaysAgo },
    },
    _count: { linkId: true },
    orderBy: { _count: { linkId: "desc" } },
    take: 5,
  });

  // Fetch link titles for the top links
  const linkIds = topLinksRaw.map((l) => l.linkId);
  const linkDetails = await prisma.link.findMany({
    where: { id: { in: linkIds } },
    select: { id: true, title: true, url: true },
  });
  const linkMap = new Map(linkDetails.map((l) => [l.id, l]));

  const topLinks = topLinksRaw.map((l) => ({
    id: l.linkId,
    title: linkMap.get(l.linkId)?.title ?? "已删除的链接",
    url: linkMap.get(l.linkId)?.url ?? "",
    clicks: l._count.linkId,
  }));

  // ─── 4. Active links count ───
  const activeLinks = await prisma.link.count({
    where: { userId, isVisible: true },
  });

  // ─── 5. 7-day change trend ───
  const firstHalf = dailyViews.slice(0, 3).reduce((s, d) => s + d.count, 0);
  const secondHalf = dailyViews.slice(4, 7).reduce((s, d) => s + d.count, 0);
  const trend =
    firstHalf > 0
      ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100)
      : secondHalf > 0
      ? 100
      : 0;

  return NextResponse.json({
    totalViews: totalViewsResult,
    dailyViews,
    topLinks,
    activeLinks,
    trend,
  });
}