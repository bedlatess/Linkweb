"use client";

/**
 * Phone Preview — Simulates the public link page in a phone frame
 *
 * Reads the live link list and theme from the Zustand store.
 * Renders the links exactly as they would appear on the public page.
 */

import { useDashboardStore } from "@/stores/dashboard-store";
import { ExternalLink, Smartphone } from "lucide-react";
import { useMemo } from "react";

// Simple icon map for common icon names
const COMMON_ICONS: Record<string, string> = {
  github: "🐙",
  twitter: "🐦",
  youtube: "▶️",
  twitch: "🎮",
  discord: "💬",
  instagram: "📷",
  linkedin: "💼",
  facebook: "👤",
  tiktok: "🎵",
  email: "✉️",
  website: "🌐",
  blog: "📝",
  music: "🎶",
  video: "🎬",
  shop: "🛒",
  donate: "💝",
  calendar: "📅",
  docs: "📄",
  newsletter: "📬",
};

function getIconDisplay(iconName: string | null): string {
  if (!iconName) return "🔗";
  const key = iconName.toLowerCase();
  return COMMON_ICONS[key] ?? "🔗";
}

export function PhonePreview() {
  const { links, theme } = useDashboardStore();

  const visibleLinks = useMemo(
    () => links.filter((l) => l.isVisible),
    [links]
  );

  // Compute preview styles from theme
  const previewStyle = useMemo(() => {
    const style: React.CSSProperties = {};
    if (theme.bgType === "color") {
      style.background = theme.bgValue;
    } else if (theme.bgType === "gradient") {
      style.background = theme.bgValue;
    } else if (theme.bgType === "image") {
      style.backgroundImage = `url(${theme.bgValue})`;
      style.backgroundSize = "cover";
      style.backgroundPosition = "center";
    }
    if (theme.bgBlur > 0) {
      style.backdropFilter = `blur(${theme.bgBlur}px)`;
    }
    return style;
  }, [theme]);

  const buttonRadiusClass =
    theme.buttonStyle === "pill"
      ? "rounded-full"
      : theme.buttonStyle === "square"
      ? "rounded-none"
      : "rounded-xl";

  return (
    <div className="flex flex-col items-center">
      {/* Phone frame */}
      <div className="relative w-[280px] overflow-hidden rounded-[2.5rem] border-[6px] border-slate-800 bg-slate-900 shadow-2xl shadow-black/50">
        {/* Notch */}
        <div className="absolute left-1/2 top-0 z-10 h-6 w-[120px] -translate-x-1/2 rounded-b-2xl bg-slate-800" />

        {/* Screen */}
        <div
          className="flex min-h-[520px] flex-col items-center px-4 pb-8 pt-10"
          style={previewStyle}
        >
          {/* Avatar placeholder */}
          <div className="mb-3 h-16 w-16 rounded-full bg-white/10 ring-2 ring-white/10" />

          {/* Name */}
          <div className="mb-1 h-3 w-24 rounded bg-white/15" />

          {/* Bio */}
          <div className="mb-6 h-2 w-40 rounded bg-white/8" />

          {/* Links */}
          <div className="w-full space-y-2.5">
            {visibleLinks.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Smartphone className="h-6 w-6 text-white/15" />
                <p className="text-xs text-white/25">还没有可见的链接</p>
              </div>
            )}

            {visibleLinks.map((link) => (
              <div
                key={link.id}
                className={`flex items-center gap-3 border border-white/[0.08] bg-white/[0.06] px-4 py-3 backdrop-blur-sm transition-all duration-200 hover:bg-white/[0.1] ${buttonRadiusClass}`}
              >
                <span className="flex-shrink-0 text-base">
                  {getIconDisplay(link.iconName)}
                </span>
                <span className="flex-1 truncate text-sm font-medium text-white/90">
                  {link.title}
                </span>
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-white/30" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <p className="mt-3 text-[11px] text-white/20">
        所见即所得 — 拖拽排序后立即生效
      </p>
    </div>
  );
}