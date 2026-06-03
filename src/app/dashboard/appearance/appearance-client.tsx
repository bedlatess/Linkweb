"use client";

/**
 * Appearance Settings — Client Component
 *
 * Theme configuration panel with:
 *   - 4 preset themes (Glassmorphism, Neumorphism, Minimal Dark, Cyberpunk)
 *   - Fine-tuning sliders (blur, border-radius)
 *   - Tip / donation config panel
 *   - Live phone preview updates via Zustand store
 */

import { useState, useEffect, useCallback } from "react";
import { useDashboardStore, type ThemePreview } from "@/stores/dashboard-store";
import {
  Sparkles,
  Layers,
  Moon,
  Zap,
  Check,
  Loader2,
  Palette,
  Coffee,
} from "lucide-react";

interface ThemeConfigFull {
  id: string;
  userId: string;
  bgType: string;
  bgValue: string;
  bgBlur: number;
  buttonStyle: string;
  fontFamily: string | null;
  customCSS: string | null;
  tipEnabled: boolean;
  tipTitle: string | null;
  paypalEmail: string | null;
  customTipUrl: string | null;
  cryptoAddress: string | null;
  updatedAt: Date;
}

interface Props {
  initialConfig: ThemeConfigFull;
}

/** Preset theme definitions */
const PRESETS: {
  key: string;
  label: string;
  icon: typeof Sparkles;
  description: string;
  config: Partial<ThemePreview>;
}[] = [
  {
    key: "glassmorphism",
    label: "经典毛玻璃",
    icon: Layers,
    description: "半透明卡片，柔和模糊背景",
    config: {
      bgType: "gradient",
      bgValue: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      bgBlur: 12,
      buttonStyle: "rounded",
    },
  },
  {
    key: "neumorphism",
    label: "新拟态",
    icon: Palette,
    description: "柔和阴影，低对比度立体感",
    config: {
      bgType: "color",
      bgValue: "#e0e5ec",
      bgBlur: 0,
      buttonStyle: "rounded",
    },
  },
  {
    key: "minimal-dark",
    label: "极简暗黑",
    icon: Moon,
    description: "纯黑背景，极简几何线条",
    config: {
      bgType: "color",
      bgValue: "#0a0a0a",
      bgBlur: 0,
      buttonStyle: "square",
    },
  },
  {
    key: "cyberpunk",
    label: "赛博朋克",
    icon: Zap,
    description: "霓虹色彩，高对比度科幻风",
    config: {
      bgType: "gradient",
      bgValue:
        "linear-gradient(135deg, #0c0024 0%, #1a0033 30%, #0a0020 60%, #1a0a2e 100%)",
      bgBlur: 4,
      buttonStyle: "pill",
    },
  },
];

export function AppearanceClient({ initialConfig }: Props) {
  const { theme, setTheme } = useDashboardStore();
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Hydrate store with server-fetched theme
  useEffect(() => {
    setTheme({
      bgType: initialConfig.bgType,
      bgValue: initialConfig.bgValue,
      bgBlur: initialConfig.bgBlur,
      buttonStyle: initialConfig.buttonStyle,
      fontFamily: initialConfig.fontFamily,
      tipEnabled: initialConfig.tipEnabled,
      tipTitle: initialConfig.tipTitle,
      paypalEmail: initialConfig.paypalEmail,
      customTipUrl: initialConfig.customTipUrl,
      cryptoAddress: initialConfig.cryptoAddress,
    });
  }, []);

  const applyPreset = useCallback(
    (preset: (typeof PRESETS)[0]) => {
      setTheme(preset.config);
      setActivePreset(preset.key);
    },
    [setTheme]
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(theme),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [theme]);

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      {/* Left: Config panel */}
      <div className="flex-1 space-y-6">
        {/* ─── Presets ─── */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/80">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            预设主题
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {PRESETS.map((preset) => {
              const Icon = preset.icon;
              const isActive = activePreset === preset.key;
              return (
                <button
                  key={preset.key}
                  onClick={() => applyPreset(preset)}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${
                    isActive
                      ? "border-indigo-500/40 bg-indigo-500/[0.06] shadow-[inset_0_0_0_1px] shadow-indigo-500/20"
                      : "border-white/[0.06] bg-white/[0.01] hover:border-white/15 hover:bg-white/[0.03]"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
                      isActive
                        ? "bg-indigo-500/20 text-indigo-400"
                        : "bg-white/[0.04] text-white/30"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        isActive ? "text-indigo-300" : "text-white/70"
                      }`}
                    >
                      {preset.label}
                    </p>
                    <p className="mt-0.5 text-xs text-white/30">
                      {preset.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Fine-tuning ─── */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/80">
            <Layers className="h-4 w-4 text-indigo-400" />
            精细调节
          </h3>

          <div className="space-y-5">
            {/* Background color */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-white/50">
                  背景颜色
                </label>
                <span className="font-mono text-xs text-white/30">
                  {theme.bgValue.length > 30
                    ? theme.bgValue.slice(0, 30) + "..."
                    : theme.bgValue}
                </span>
              </div>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={
                    theme.bgType === "color" && theme.bgValue.startsWith("#")
                      ? theme.bgValue
                      : "#0a0a0a"
                  }
                  onChange={(e) => {
                    setTheme({ bgType: "color", bgValue: e.target.value });
                    setActivePreset(null);
                  }}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                />
                <input
                  type="text"
                  value={theme.bgValue}
                  onChange={(e) => {
                    setTheme({ bgValue: e.target.value });
                    setActivePreset(null);
                  }}
                  placeholder="hex color or gradient CSS"
                  className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-mono text-white/70 placeholder:text-white/15 backdrop-blur-sm transition-all focus:border-indigo-500/40 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                />
              </div>
            </div>

            {/* Blur slider */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-white/50">
                  卡片模糊度
                </label>
                <span className="font-mono text-xs text-white/30">
                  {theme.bgBlur}px
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={24}
                value={theme.bgBlur}
                onChange={(e) => {
                  setTheme({ bgBlur: Number(e.target.value) });
                  setActivePreset(null);
                }}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-indigo-500 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-400 [&::-webkit-slider-thumb]:shadow-lg"
              />
            </div>

            {/* Button style */}
            <div>
              <label className="mb-2 block text-xs font-medium text-white/50">
                按钮圆角
              </label>
              <div className="flex gap-2">
                {[
                  { key: "rounded", label: "圆角" },
                  { key: "pill", label: "胶囊" },
                  { key: "square", label: "直角" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setTheme({ buttonStyle: key });
                      setActivePreset(null);
                    }}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200 ${
                      theme.buttonStyle === key
                        ? "border-indigo-500/40 bg-indigo-500/[0.08] text-indigo-300"
                        : "border-white/[0.06] bg-white/[0.01] text-white/40 hover:border-white/15 hover:text-white/60"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Tip / Donation Config ─── */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/80">
            <Coffee className="h-4 w-4 text-amber-400" />
            打赏组件配置
          </h3>

          <div className="space-y-4">
            {/* Enable toggle */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-white/50">
                在公开主页显示打赏按钮
              </label>
              <button
                type="button"
                onClick={() => setTheme({ tipEnabled: !theme.tipEnabled })}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${
                  theme.tipEnabled ? "bg-amber-500/60" : "bg-white/10"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    theme.tipEnabled
                      ? "translate-x-[18px]"
                      : "translate-x-[3px]"
                  }`}
                />
              </button>
            </div>

            {theme.tipEnabled && (
              <>
                {/* Tip button title */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/40">
                    按钮文字
                  </label>
                  <input
                    type="text"
                    value={theme.tipTitle ?? ""}
                    onChange={(e) =>
                      setTheme({ tipTitle: e.target.value || null })
                    }
                    placeholder="☕ 赞助我 (Support Me)"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/15 backdrop-blur-sm transition-all focus:border-amber-500/40 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-amber-500/15"
                  />
                </div>

                {/* Custom tip URL */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/40">
                    第三方打赏链接{" "}
                    <span className="text-white/20">
                      (Ko-fi / 爱发电 / BuyMeACoffee)
                    </span>
                  </label>
                  <input
                    type="url"
                    value={theme.customTipUrl ?? ""}
                    onChange={(e) =>
                      setTheme({
                        customTipUrl: e.target.value || null,
                      })
                    }
                    placeholder="https://ko-fi.com/yourname"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/15 backdrop-blur-sm transition-all focus:border-amber-500/40 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-amber-500/15"
                  />
                </div>

                {/* PayPal email */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/40">
                    PayPal 邮箱
                  </label>
                  <input
                    type="email"
                    value={theme.paypalEmail ?? ""}
                    onChange={(e) =>
                      setTheme({
                        paypalEmail: e.target.value || null,
                      })
                    }
                    placeholder="your@paypal.com"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/15 backdrop-blur-sm transition-all focus:border-amber-500/40 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-amber-500/15"
                  />
                </div>

                {/* Crypto address */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/40">
                    加密货币地址{" "}
                    <span className="text-white/20">(ETH/BTC/SOL)</span>
                  </label>
                  <input
                    type="text"
                    value={theme.cryptoAddress ?? ""}
                    onChange={(e) =>
                      setTheme({
                        cryptoAddress: e.target.value || null,
                      })
                    }
                    placeholder="0x..."
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs text-white/70 placeholder:text-white/15 backdrop-blur-sm transition-all focus:border-amber-500/40 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-amber-500/15"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* ─── Save button ─── */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-400 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : saved ? (
            <>
              <Check className="h-4 w-4" />
              已保存
            </>
          ) : (
            "保存主题设置"
          )}
        </button>
      </div>

      {/* Right: Phone Preview */}
      <div className="xl:sticky xl:top-6 xl:w-[340px] xl:flex-shrink-0">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-white/30">
            实时预览
          </span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>
        <AppearancePhonePreview />
      </div>
    </div>
  );
}

/** Phone preview for the appearance page */
function AppearancePhonePreview() {
  const { links, theme } = useDashboardStore();

  const visibleLinks = links.filter((l) => l.isVisible);

  const previewStyle: React.CSSProperties = {};
  if (theme.bgType === "color" || theme.bgType === "gradient") {
    previewStyle.background = theme.bgValue;
  }

  const buttonRadiusClass =
    theme.buttonStyle === "pill"
      ? "rounded-full"
      : theme.buttonStyle === "square"
      ? "rounded-none"
      : "rounded-xl";

  const hasBlur = theme.bgBlur > 0;
  const tipLabel = theme.tipTitle || "☕ 赞助我";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[280px] overflow-hidden rounded-[2.5rem] border-[6px] border-slate-800 bg-slate-900 shadow-2xl shadow-black/50">
        <div className="absolute left-1/2 top-0 z-10 h-6 w-[120px] -translate-x-1/2 rounded-b-2xl bg-slate-800" />

        <div
          className="flex min-h-[520px] flex-col items-center px-4 pb-8 pt-10"
          style={previewStyle}
        >
          {/* Tip button (top) */}
          {theme.tipEnabled && (
            <div className="mb-4 w-full">
              <div
                className={`flex items-center justify-center gap-2 border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-300 backdrop-blur-sm transition-all animate-pulse ${buttonRadiusClass}`}
              >
                ☕ {tipLabel}
              </div>
            </div>
          )}

          <div className="mb-3 h-16 w-16 rounded-full bg-white/10 ring-2 ring-white/10" />
          <div className="mb-1 h-3 w-24 rounded bg-white/15" />
          <div className="mb-6 h-2 w-40 rounded bg-white/8" />

          <div className="w-full space-y-2.5">
            {visibleLinks.length === 0 && (
              <div className="py-8 text-center text-xs text-white/25">
                还没有可见的链接
              </div>
            )}
            {visibleLinks.map((link) => (
              <div
                key={link.id}
                className={`flex items-center gap-3 border border-white/[0.08] px-4 py-3 transition-all duration-200 hover:border-white/[0.15] ${
                  hasBlur
                    ? "bg-white/[0.06] backdrop-blur-md"
                    : "bg-white/[0.06]"
                } ${buttonRadiusClass}`}
                style={
                  hasBlur
                    ? { backdropFilter: `blur(${theme.bgBlur}px)` }
                    : undefined
                }
              >
                <span className="flex-shrink-0 text-base">
                  {link.iconName ? `[${link.iconName}]` : "🔗"}
                </span>
                <span className="flex-1 truncate text-sm font-medium text-white/90">
                  {link.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-white/20">
        所见即所得 — 切换主题实时预览
      </p>
    </div>
  );
}