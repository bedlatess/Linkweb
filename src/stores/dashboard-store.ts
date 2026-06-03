/**
 * LinkWeb Dashboard State Store (Zustand)
 *
 * Manages client-side UI state:
 *   - Links list (synced with API)
 *   - Theme config for live preview
 *   - Tip / donation config
 *   - Dragging state for dnd-kit
 */

import { create } from "zustand";

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  iconName: string | null;
  isVisible: boolean;
  sortOrder: number;
  groupName: string | null;
}

export interface ThemePreview {
  bgType: string;
  bgValue: string;
  bgBlur: number;
  buttonStyle: string;
  fontFamily: string | null;
  tipEnabled: boolean;
  tipTitle: string | null;
  paypalEmail: string | null;
  customTipUrl: string | null;
  cryptoAddress: string | null;
}

interface DashboardState {
  // Links
  links: LinkItem[];
  setLinks: (links: LinkItem[]) => void;
  addLink: (link: LinkItem) => void;
  updateLink: (id: string, data: Partial<LinkItem>) => void;
  removeLink: (id: string) => void;
  reorderLinks: (fromIndex: number, toIndex: number) => void;

  // Theme preview
  theme: ThemePreview;
  setTheme: (theme: Partial<ThemePreview>) => void;

  // UI state
  isAddingLink: boolean;
  setIsAddingLink: (v: boolean) => void;
  editingLinkId: string | null;
  setEditingLinkId: (id: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  // Links
  links: [],
  setLinks: (links) => set({ links }),
  addLink: (link) =>
    set((state) => ({ links: [...state.links, link] })),
  updateLink: (id, data) =>
    set((state) => ({
      links: state.links.map((l) => (l.id === id ? { ...l, ...data } : l)),
    })),
  removeLink: (id) =>
    set((state) => ({ links: state.links.filter((l) => l.id !== id) })),
  reorderLinks: (fromIndex, toIndex) =>
    set((state) => {
      const links = [...state.links];
      const [moved] = links.splice(fromIndex, 1);
      links.splice(toIndex, 0, moved);
      return { links: links.map((l, i) => ({ ...l, sortOrder: i })) };
    }),

  // Theme preview
  theme: {
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
  },
  setTheme: (partial) =>
    set((state) => ({ theme: { ...state.theme, ...partial } })),

  // UI state
  isAddingLink: false,
  setIsAddingLink: (v) =>
    set({
      isAddingLink: v,
      editingLinkId: v
        ? null
        : (undefined as unknown as string | null),
    }),
  editingLinkId: null,
  setEditingLinkId: (id) => set({ editingLinkId: id, isAddingLink: false }),
}));