import { create } from "zustand";

export type ViewName =
  // public
  | "landing"
  | "visitor-register"
  | "visitor-status"
  | "visitor-feedback"
  | "login"
  // security
  | "security-dashboard"
  | "security-walkin"
  | "security-exit"
  | "security-history"
  // staff
  | "staff-dashboard"
  | "staff-history"
  // admin
  | "admin-dashboard"
  | "admin-users"
  | "admin-departments"
  | "admin-audit"
  | "admin-settings"
  | "admin-reports";

interface RouterState {
  view: ViewName;
  params: Record<string, string>;
  navigate: (view: ViewName, params?: Record<string, string>) => void;
  back: () => void;
  history: { view: ViewName; params: Record<string, string> }[];
}

export const useRouterStore = create<RouterState>((set, get) => ({
  view: "landing",
  params: {},
  history: [],
  navigate: (view, params = {}) => {
    const current = get();
    set({
      view,
      params,
      history: [...current.history, { view: current.view, params: current.params }].slice(-20),
    });
  },
  back: () => {
    const h = get().history;
    if (h.length > 0) {
      const last = h[h.length - 1];
      set({ view: last.view, params: last.params, history: h.slice(0, -1) });
    } else {
      set({ view: "landing", params: {} });
    }
  },
}));

interface UIState {
  language: "bm" | "en";
  toggleLanguage: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  language: "bm",
  toggleLanguage: () => set({ language: get().language === "bm" ? "en" : "bm" }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
