import { create } from "zustand";
import { persist } from "zustand/middleware";
import i18n, { RTL_LANGUAGES, SUPPORTED_LANGUAGES } from "@/i18n";

function systemTheme() {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/** Briefly flags <html> so CSS can animate theme / language changes. */
function flashDocumentClass(className, duration = 450) {
  if (typeof document === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const root = document.documentElement;
  root.classList.add(className);
  window.clearTimeout(flashDocumentClass.timers?.[className]);
  flashDocumentClass.timers = { ...(flashDocumentClass.timers || {}), [className]: window.setTimeout(() => root.classList.remove(className), duration) };
}

function applyTheme(theme) {
  const resolvedTheme = theme === "system" ? systemTheme() : theme;
  document.documentElement.setAttribute("data-theme", resolvedTheme);
  document.documentElement.dataset.themeMode = theme;
}

function applyLanguage(language) {
  const lang = SUPPORTED_LANGUAGES.includes(language) ? language : "en";
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL_LANGUAGES.includes(lang) ? "rtl" : "ltr";
  if (i18n.language !== lang) i18n.changeLanguage(lang);
}

export const useUIStore = create(
  persist(
    (set, get) => ({
      theme: "system", // "dark" | "light" | "system"
      language: "en", // "en" | "fa" | "ps"
      mobileMenuOpen: false,
      commandPaletteOpen: false,

      toggleTheme: () =>
        set((state) => {
          const order = ["dark", "light", "system"];
          const next = order[(order.indexOf(state.theme) + 1) % order.length];
          flashDocumentClass("theme-switching");
          applyTheme(next);
          return { theme: next };
        }),
      setTheme: (theme) =>
        set(() => {
          flashDocumentClass("theme-switching");
          applyTheme(theme);
          return { theme };
        }),

      setLanguage: (lang) =>
        set(() => {
          const language = SUPPORTED_LANGUAGES.includes(lang) ? lang : "en";
          flashDocumentClass("lang-switching", 480);
          applyLanguage(language);
          return { language };
        }),

      toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
      closeMobileMenu: () => set({ mobileMenuOpen: false }),

      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),
      toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

      /** Sync <html> attributes on app boot from the persisted state. */
      hydrateDocument: () => {
        const { theme, language } = get();
        applyTheme(theme);
        applyLanguage(language);
      },
    }),
    {
      name: "portfolio-ui-settings",
      partialize: (state) => ({ theme: state.theme, language: state.language }),
    }
  )
);
