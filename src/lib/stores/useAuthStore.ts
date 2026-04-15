import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser, LoginRequest } from '@/types';
import { authService } from '@/services/auth.service';
import { AxiosError, isAxiosError } from 'axios';
import { useCartStore } from '@/lib/stores/useCartStore';

// ── Cookie helpers ───────────────────────────────────────────────────────────
const setUserRoleCookie = (role: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `user_role=${role}; path=/; max-age=2592000; SameSite=Lax`;
};

const clearUserRoleCookie = () => {
  if (typeof document === 'undefined') return;
  document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
};

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAuth: (user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => void;
  validateSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setAuth: (user) => {
        set({ user, isAuthenticated: true, error: null });
      },

      setUser: (user) => {
        set({ user });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearAuth: () => {
        clearUserRoleCookie();
        set({ user: null, isAuthenticated: false, error: null });
      },

      login: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(data);
          const user = response?.data?.user ?? null;
          if (user?.role) setUserRoleCookie(user.role);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (err: unknown) {
          let errorMessage = 'Login failed';

          if (err instanceof AxiosError && err.response?.data) {
            const data = err.response.data as { error?: string; message?: string; detail?: string };
            errorMessage = data.error || data.message || data.detail || errorMessage;
          } else if (err instanceof Error) {
            errorMessage = err.message;
          }

          set({
            error: errorMessage,
            isLoading: false,
          });
          throw err;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } catch (err) {
          if (!(isAxiosError(err) && err.response?.status === 401)) {
            console.error('Logout service error:', err);
          }
        } finally {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem('gimxa-auth-storage');
          }
          useCartStore.getState().resetCartState();
          clearUserRoleCookie();
          set({ user: null, isAuthenticated: false, isLoading: false, error: null });
        }
      },

      validateSession: async () => {
        // Only run if we think we're authenticated (state persisted from localStorage)
        if (!get().isAuthenticated) return;

        set({ isLoading: true, error: null });
        try {
          const user = get().user;
          if (user) {
            set({ user, isAuthenticated: true, isLoading: false, error: null });
          } else {
            // Response OK but no user — treat session as invalid
            get().clearAuth();
            set({ isLoading: false });
          }
        } catch (err: unknown) {
          // refreshToken failed (401/403/network) → session is dead
          if (
            err instanceof AxiosError &&
            (err.response?.status === 401 || err.response?.status === 403)
          ) {
            get().clearAuth();
          } else {
            // Network error or server error — keep existing auth state, don't log out
            console.warn('[validateSession] Non-auth error during refresh, keeping session:', err);
          }
          set({ isLoading: false, error: null });
        }
      },
    }),
    {
      name: 'gimxa-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
