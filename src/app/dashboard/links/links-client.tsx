"use client";

/**
 * Links Client Component — Interactive link manager
 *
 * Features:
 *   - dnd-kit drag-and-drop sorting
 *   - Add / Edit / Delete links
 *   - Live phone preview of the public link page
 */

import { useState, useCallback, useEffect } from "react";
import { useDashboardStore, type LinkItem } from "@/stores/dashboard-store";
import { LinkEditor } from "./link-editor";
import { LinkList } from "./link-list";
import { PhonePreview } from "./phone-preview";
import { Plus } from "lucide-react";

interface Props {
  initialLinks: LinkItem[];
}

export function LinksClient({ initialLinks }: Props) {
  const { setLinks, isAddingLink, setIsAddingLink } = useDashboardStore();

  // Hydrate store with server-fetched data
  useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks, setLinks]);

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      {/* Left: Link Editor */}
      <div className="flex-1 space-y-4">
        {/* Add button + form */}
        {!isAddingLink ? (
          <button
            onClick={() => setIsAddingLink(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-4 text-sm font-medium text-white/50 backdrop-blur-sm transition-all duration-200 hover:border-white/25 hover:bg-white/[0.04] hover:text-white/70"
          >
            <Plus className="h-4 w-4" />
            添加新链接
          </button>
        ) : (
          <LinkEditor
            mode="create"
            onClose={() => setIsAddingLink(false)}
          />
        )}

        {/* Sortable link list */}
        <LinkList />
      </div>

      {/* Right: Phone Preview */}
      <div className="xl:sticky xl:top-6 xl:w-[340px] xl:flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-white/30 uppercase tracking-wider">
            实时预览
          </span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>
        <PhonePreview />
      </div>
    </div>
  );
}