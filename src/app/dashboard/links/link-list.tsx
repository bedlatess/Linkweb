"use client";

/**
 * Sortable Link List — dnd-kit drag-and-drop
 *
 * Renders the user's links as a sortable list.
 * Supports: drag reorder, inline edit, delete, visibility toggle.
 */

import { useState, useCallback } from "react";
import { useDashboardStore } from "@/stores/dashboard-store";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LinkEditor } from "./link-editor";
import {
  GripVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Link2,
  Loader2,
} from "lucide-react";
import type { LinkItem } from "@/stores/dashboard-store";

export function LinkList() {
  const { links, reorderLinks, removeLink, updateLink } = useDashboardStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = links.findIndex((l) => l.id === active.id);
      const newIndex = links.findIndex((l) => l.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      // Optimistic update
      reorderLinks(oldIndex, newIndex);

      // Persist to API
      const reordered = [...links];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      const items = reordered.map((l, i) => ({ id: l.id, sortOrder: i }));

      setSaving(true);
      try {
        await fetch("/api/links/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });
      } catch {
        // TODO: rollback on failure
      } finally {
        setSaving(false);
      }
    },
    [links, reorderLinks]
  );

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
      if (res.ok) {
        removeLink(id);
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleVisibility(id: string, current: boolean) {
    const newValue = !current;
    updateLink(id, { isVisible: newValue });
    await fetch(`/api/links/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVisible: newValue }),
    });
  }

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-16 text-center">
        <Link2 className="mb-3 h-8 w-8 text-white/15" />
        <p className="text-sm text-white/30">还没有添加任何链接</p>
        <p className="mt-1 text-xs text-white/15">
          点击上方按钮添加你的第一个链接
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {saving && (
        <div className="flex items-center gap-2 rounded-lg bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-300">
          <Loader2 className="h-3 w-3 animate-spin" />
          正在保存排序...
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={links.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1.5">
            {links.map((link) => (
              <SortableLinkItem
                key={link.id}
                link={link}
                onEdit={() => setEditingId(link.id)}
                onDelete={() => handleDelete(link.id)}
                onToggleVisibility={() =>
                  toggleVisibility(link.id, link.isVisible)
                }
                isDeleting={deletingId === link.id}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Inline editor */}
      {editingId && (
        <div className="mt-3">
          <LinkEditor
            mode="edit"
            onClose={() => setEditingId(null)}
          />
        </div>
      )}
    </div>
  );
}

/** Single sortable link row */
function SortableLinkItem({
  link,
  onEdit,
  onDelete,
  onToggleVisibility,
  isDeleting,
}: {
  link: LinkItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  isDeleting: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200 ${
        isDragging
          ? "border-indigo-500/40 bg-indigo-500/[0.06] shadow-lg shadow-indigo-500/10 z-50"
          : "border-white/[0.06] bg-white/[0.015] hover:border-white/10 hover:bg-white/[0.03]"
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab rounded p-1 text-white/20 transition-colors hover:text-white/50 active:cursor-grabbing"
        title="拖拽排序"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Link info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-white/80">
            {link.title}
          </span>
          <span className="flex-shrink-0 text-[11px] text-white/25">
            {link.iconName && `[${link.iconName}]`}
          </span>
        </div>
        <p className="truncate text-xs text-white/30">{link.url}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {/* Visibility */}
        <button
          onClick={onToggleVisibility}
          className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/[0.05] hover:text-white/60"
          title={link.isVisible ? "隐藏" : "显示"}
        >
          {link.isVisible ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Open URL */}
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/[0.05] hover:text-white/60"
          title="打开链接"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

        {/* Edit */}
        <button
          onClick={onEdit}
          className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/[0.05] hover:text-indigo-400"
          title="编辑"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-red-500/[0.08] hover:text-red-400 disabled:opacity-50"
          title="删除"
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}