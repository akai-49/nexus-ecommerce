import { create } from 'zustand';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: {
    id: string;
    email: string;
    roles: string[];
  } | null;
  isHydrated: boolean;
  setAuth: (token: string, refreshToken: string, user: any) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  user: null,
  isHydrated: false,
  setAuth: (token, refreshToken, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ token, refreshToken, user, isHydrated: true });
  },
  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
    set({ token: null, refreshToken: null, user: null, isHydrated: true });
  },
  hydrate: () => {
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        set({ token, refreshToken, user, isHydrated: true });
      } catch (err) {
        set({ isHydrated: true });
      }
    }
  },
}));

