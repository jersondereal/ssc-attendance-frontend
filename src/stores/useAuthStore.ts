import axios from "axios";
import { create } from "zustand";
import type { AuthUser } from "./types";

interface AuthState {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  isLoginModalOpen: boolean;
  setUser: (user: AuthUser, token: string) => void;
  logout: () => void;
  setLoginModalOpen: (open: boolean) => void;
  initFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoginModalOpen: false,

  setUser: (user, token) => {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem(
      "user",
      JSON.stringify({ token, user: { ...user, id: user.id, rawRole: user.rawRole } })
    );
    set({
      currentUser: user,
      isAuthenticated: true,
      isLoginModalOpen: false,
    });
  },

  logout: () => {
    delete axios.defaults.headers.common["Authorization"];
    localStorage.removeItem("user");
    set({
      currentUser: null,
      isAuthenticated: false,
      isLoginModalOpen: false,
    });
  },

  setLoginModalOpen: (open) => set({ isLoginModalOpen: open }),

  initFromStorage: () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const { token, user } = JSON.parse(storedUser);
        if (token && user) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          const raw =
            user.rawRole ??
            (["administrator", "moderator", "viewer"].includes(user.role)
              ? user.role
              : "viewer");
          const label =
            raw === "administrator"
              ? "Administrator"
              : raw === "moderator"
                ? "Moderator"
                : "Viewer";
          set({
            currentUser: {
              id: user.id,
              username: user.username,
              role: user.role ?? label,
              rawRole: raw as "administrator" | "moderator" | "viewer",
            },
            isAuthenticated: true,
            isLoginModalOpen: false,
          });
          return;
        }
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        localStorage.removeItem("user");
      }
    }
    set({
      currentUser: null,
      isAuthenticated: false,
      isLoginModalOpen: false,
    });
  },
}));
