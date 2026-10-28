"use client";

/**
 * Portal store — client session, preferences, and UI state (Zustand).
 * Sound cues default OFF (persisted to the server user record + localStorage).
 */
import { create } from "zustand";

type PortalState = {
  sidebarCollapsed: boolean;
  notificationOpen: boolean;
  soundEnabled: boolean;
  toggleSidebar: () => void;
  setNotificationOpen: (v: boolean) => void;
  setSoundEnabled: (v: boolean) => void;
};

const SIDEBAR_KEY = "vartistic.sidebar.collapsed";
const SOUND_KEY = "vartistic.sound.enabled";

function readLocalBool(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  const v = window.localStorage.getItem(key);
  if (v === null) return fallback;
  return v === "1";
}

export const usePortal = create<PortalState>((set) => ({
  sidebarCollapsed: false,
  notificationOpen: false,
  soundEnabled: false,
  toggleSidebar: () =>
    set((s) => {
      const next = !s.sidebarCollapsed;
      window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      return { sidebarCollapsed: next };
    }),
  setNotificationOpen: (v) => set({ notificationOpen: v }),
  setSoundEnabled: (v) => {
    window.localStorage.setItem(SOUND_KEY, v ? "1" : "0");
    set({ soundEnabled: v });
  },
}));

// hydrate sidebar collapse from storage on first client render
if (typeof window !== "undefined") {
  const collapsed = readLocalBool(SIDEBAR_KEY, false);
  usePortal.setState({ sidebarCollapsed: collapsed, soundEnabled: readLocalBool(SOUND_KEY, false) });
}
