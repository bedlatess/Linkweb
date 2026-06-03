"use client";

/**
 * Settings Client — Profile info + Custom Domain binding
 */

import { useState, useEffect } from "react";
import {
  User,
  Globe,
  Loader2,
  Check,
  X,
  ExternalLink,
  Info,
} from "lucide-react";

interface Props {
  userName: string;
  userEmail: string;
  username: string;
  initialDomain: string | null;
}

export function SettingsClient({
  userName,
  userEmail,
  username,
  initialDomain,
}: Props) {
  const [domain, setDomain] = useState(initialDomain ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [currentDomain, setCurrentDomain] = useState(initialDomain);

  // Sync if initialDomain changes
  useEffect(() => {
    setDomain(initialDomain ?? "");
    setCurrentDomain(initialDomain);
  }, [initialDomain]);

  async function handleSaveDomain() {
    setError("");
    setSaved(false);

    const cleanDomain = domain.trim().toLowerCase();

    if (cleanDomain === "" || cleanDomain === currentDomain) {
      // Removing domain
      setSaving(true);
      try {
        const res = await fetch("/api/settings/domain", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain: "" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setCurrentDomain(null);
        setDomain("");
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "操作失败");
      } finally {
        setSaving(false);
      }
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings/domain", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: cleanDomain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCurrentDomain(cleanDomain);
      setDomain(cleanDomain);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ─── Profile card ─── */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06]">
            <User className="h-6 w-6 text-white/30" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{userName}</p>
            <p className="text-sm text-white/40">{userEmail}</p>
          </div>
        </div>

        {/* Public page link */}
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.01] px-3 py-2">
          <Globe className="h-4 w-4 flex-shrink-0 text-white/25" />
          <span className="text-sm text-white/40">公开页面：</span>
          <a
            href={`/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-indigo-400 transition-colors hover:text-indigo-300"
          >
            /{username}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* ─── Custom Domain Binding ─── */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/80">
          <Globe className="h-4 w-4 text-indigo-400" />
          自定义域名绑定
        </h3>

        {currentDomain && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-2.5">
            <Check className="h-4 w-4 text-emerald-400" />
            <span className="text-sm text-emerald-300">
              已绑定域名：{currentDomain}
            </span>
            <button
              onClick={() => {
                setDomain("");
                setCurrentDomain(null);
                handleSaveDomain();
              }}
              className="ml-auto rounded-lg p-1 text-emerald-400/50 transition-colors hover:bg-emerald-500/[0.1] hover:text-red-400"
              title="解绑域名"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">
              绑定你的专属域名
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="link.yourbrand.com"
                className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/15 backdrop-blur-sm transition-all focus:border-indigo-500/40 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
              />
              <button
                onClick={handleSaveDomain}
                disabled={saving || domain === currentDomain}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-400 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : saved ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  "绑定"
                )}
              </button>
            </div>
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
          </div>

          {/* Setup instructions */}
          <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-4">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/30" />
              <div className="space-y-2 text-xs text-white/35">
                <p className="font-medium text-white/45">如何配置自定义域名：</p>
                <ol className="list-inside list-decimal space-y-1">
                  <li>
                    前往你的域名服务商（如 Cloudflare、阿里云 DNS）
                  </li>
                  <li>
                    添加一条{" "}
                    <span className="font-mono text-indigo-400/70">
                      CNAME
                    </span>{" "}
                    记录，指向本服务器的 IP 地址
                  </li>
                  <li>
                    等待 DNS 生效（通常 1-10 分钟），即可用你的域名访问
                  </li>
                </ol>
                <p className="text-white/20">
                  提示：CNAME 记录的目标地址为部署 LinkWeb 的服务器 IP 或域名。
                  如果你使用 Docker Compose + Caddy 部署，Caddy 会自动处理 TLS
                  证书。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}