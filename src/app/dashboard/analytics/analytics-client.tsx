"use client";

/**
 * Analytics Dashboard — Client Component
 *
 * Fetches analytics data from GET /api/analytics and renders:
 *   1. Three stat cards (Total Views, Active Links, 7-Day Trend)
 *   2. 7-day trend area chart (Recharts)
 *   3. Top 5 links horizontal bar chart (Recharts)
 */

import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Link2,
  BarChart3,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface AnalyticsData {
  totalViews: number;
  dailyViews: { date: string; count: number }[];
  topLinks: { id: string; title: string; url: string; clicks: number }[];
  activeLinks: number;
  trend: number;
}

export function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/analytics");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError("无法加载分析数据");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-16 text-center">
        <BarChart3 className="mb-3 h-8 w-8 text-white/15" />
        <p className="text-sm text-white/30">{error || "暂无数据"}</p>
      </div>
    );
  }

  const trendIcon =
    data.trend >= 0 ? (
      <TrendingUp className="h-5 w-5 text-emerald-400" />
    ) : (
      <TrendingDown className="h-5 w-5 text-red-400" />
    );
  const trendColor = data.trend >= 0 ? "text-emerald-400" : "text-red-400";
  const trendLabel = data.trend >= 0 ? `+${data.trend}%` : `${data.trend}%`;

  // Format date for x-axis labels
  const chartData = data.dailyViews.map((d) => ({
    ...d,
    label: d.date.slice(5), // "06-02" from "2026-06-02"
  }));

  return (
    <div className="space-y-6">
      {/* ─── Stat Cards ─── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total Views */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/15">
              <Eye className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/40">总点击量</p>
              <p className="text-2xl font-bold text-white">{data.totalViews}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-white/25">过去 7 天</p>
        </div>

        {/* Active Links */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/15">
              <Link2 className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/40">激活链接数</p>
              <p className="text-2xl font-bold text-white">{data.activeLinks}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-white/25">当前可见链接</p>
        </div>

        {/* 7-Day Trend */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              data.trend >= 0 ? "bg-emerald-500/15" : "bg-red-500/15"
            }`}>
              {trendIcon}
            </div>
            <div>
              <p className="text-xs font-medium text-white/40">7天趋势</p>
              <p className={`text-2xl font-bold ${trendColor}`}>
                {trendLabel}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-white/25">前3天 vs 后3天对比</p>
        </div>
      </div>

      {/* ─── 7-Day Trend Chart ─── */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
        <h3 className="mb-4 text-sm font-semibold text-white/70">
          7 天点击量趋势
        </h3>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(15,23,42,0.95)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  backdropFilter: "blur(16px)",
                  color: "#fff",
                  fontSize: "13px",
                }}
                labelFormatter={(label) => `日期: ${label}`}
                formatter={(value) => [`${value} 次点击`, "点击量"]}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#818cf8"
                strokeWidth={2}
                fill="url(#colorViews)"
                dot={{ fill: "#818cf8", r: 3, strokeWidth: 0 }}
                activeDot={{ fill: "#a5b4fc", r: 5, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Top Links Chart ─── */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
        <h3 className="mb-4 text-sm font-semibold text-white/70">
          热门链接 Top 5
        </h3>
        {data.topLinks.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <BarChart3 className="mb-2 h-8 w-8 text-white/10" />
            <p className="text-sm text-white/25">还没有点击数据</p>
            <p className="mt-1 text-xs text-white/15">
              分享你的链接页面以收集访问数据
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.topLinks.map((link, index) => (
              <div key={link.id} className="flex items-center gap-3">
                {/* Rank */}
                <div
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    index === 0
                      ? "bg-amber-500/15 text-amber-400"
                      : index === 1
                      ? "bg-slate-400/15 text-slate-300"
                      : index === 2
                      ? "bg-orange-700/15 text-orange-500"
                      : "bg-white/[0.04] text-white/30"
                  }`}
                >
                  {index + 1}
                </div>

                {/* Bar */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="truncate text-sm font-medium text-white/70">
                      {link.title}
                    </span>
                    <span className="ml-2 flex-shrink-0 text-xs text-white/40">
                      {link.clicks} 次
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.04]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                      style={{
                        width: `${
                          (link.clicks / data.topLinks[0].clicks) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Refresh hint ─── */}
      <p className="text-center text-xs text-white/15">
        数据每 30 分钟自动更新 · 仅统计过去 7 天
      </p>
    </div>
  );
}