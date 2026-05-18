// ============================================================
// Zustand Store — AtomQuest Portal
// Central state for notifications, goals, UI flags
// ============================================================

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ---- Notification Store ----
interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  decrementUnread: () => void;
  clearUnread: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set) => ({
      unreadCount: 0,
      setUnreadCount: (count) => set({ unreadCount: count }),
      decrementUnread: () => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
      clearUnread: () => set({ unreadCount: 0 }),
    }),
    { name: 'notifications' },
  ),
);

// ---- UI Store ----
interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    { name: 'ui' },
  ),
);

// ---- Goals Store — local cache for quick access ----
interface GoalFilter {
  status?: string;
  thrustArea?: string;
  search?: string;
  page: number;
  limit: number;
}

interface GoalsState {
  filter: GoalFilter;
  setFilter: (filter: Partial<GoalFilter>) => void;
  resetFilter: () => void;
}

const defaultFilter: GoalFilter = { page: 1, limit: 20 };

export const useGoalsStore = create<GoalsState>()(
  devtools(
    persist(
      (set) => ({
        filter: defaultFilter,
        setFilter: (partial) =>
          set((s) => ({ filter: { ...s.filter, ...partial, page: 1 } })),
        resetFilter: () => set({ filter: defaultFilter }),
      }),
      { name: 'goals-filter' },
    ),
    { name: 'goals' },
  ),
);
