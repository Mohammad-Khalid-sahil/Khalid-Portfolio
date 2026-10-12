import { create } from "zustand";

export const useAuthStore = create((set) => ({
  accessToken: null,
  user: null, // { id, name, email, role }

  setSession: (accessToken, user) => set({ accessToken, user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clearSession: () => set({ accessToken: null, user: null }),

  isAuthenticated: () => Boolean(useAuthStore.getState().accessToken),
}));
