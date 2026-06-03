"use client";

/**
 * Link Editor — Create or Edit a link
 *
 * mode="create" → POST /api/links
 * mode="edit"   → PATCH /api/links/[id]
 */

import { useState, useEffect } from "react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { X, Loader2, Check } from "lucide-react";

interface Props {
  mode: "create" | "edit";
  onClose: () => void;
}

export function LinkEditor({ mode, onClose }: Props) {
  const { addLink, updateLink, editingLinkId, links, setEditingLinkId } =
    useDashboardStore();

  const existingLink = mode === "edit" ? links.find((l) => l.id === editingLinkId) : null;

  const [title, setTitle] = useState(existingLink?.title ?? "");
  const [url, setUrl] = useState(existingLink?.url ?? "");
  const [iconName, setIconName] = useState(existingLink?.iconName ?? "");
  const [isVisible, setIsVisible] = useState(existingLink?.isVisible ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim() || !url.trim()) {
      setError("标题和链接地址不能为空");
      return;
    }

    setSaving(true);

    try {
      if (mode === "create") {
        const res = await fetch("/api/links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            url: url.trim(),
            iconName: iconName.trim() || null,
            isVisible,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "创建失败");
        }

        const newLink = await res.json();
        addLink(newLink);
        onClose();
      } else {
        if (!editingLinkId) return;

        const res = await fetch(`/api/links/${editingLinkId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            url: url.trim(),
            iconName: iconName.trim() || null,
            isVisible,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "更新失败");
        }

        updateLink(editingLinkId, {
          title: title.trim(),
          url: url.trim(),
          iconName: iconName.trim() || null,
          isVisible,
        });
        setEditingLinkId(null);
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          {mode === "create" ? "添加新链接" : "编辑链接"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-white/30 transition-colors hover:bg-white/[0.05] hover:text-white/60"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Title */}
        <div>
          <label className="mb-1 block text-xs font-medium text-white/40">
            标题
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：GitHub"
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/15 backdrop-blur-sm transition-all focus:border-indigo-500/40 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
          />
        </div>

        {/* URL */}
        <div>
          <label className="mb-1 block text-xs font-medium text-white/40">
            URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/yourname"
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/15 backdrop-blur-sm transition-all focus:border-indigo-500/40 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
          />
        </div>

        {/* Icon Name */}
        <div>
          <label className="mb-1 block text-xs font-medium text-white/40">
            图标名称{" "}
            <span className="text-white/20">(Lucide 图标，可选)</span>
          </label>
          <input
            type="text"
            value={iconName}
            onChange={(e) => setIconName(e.target.value)}
            placeholder="例如：github, twitter, youtube"
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/15 backdrop-blur-sm transition-all focus:border-indigo-500/40 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
          />
        </div>

        {/* Visibility toggle */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-white/40">可见</label>
          <button
            type="button"
            onClick={() => setIsVisible(!isVisible)}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${
              isVisible ? "bg-indigo-500/60" : "bg-white/10"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                isVisible ? "translate-x-[18px]" : "translate-x-[3px]"
              }`}
            />
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        {/* Submit */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/50 backdrop-blur-sm transition-colors hover:bg-white/[0.05] hover:text-white/70"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-400 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                {mode === "create" ? "添加" : "保存"}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}