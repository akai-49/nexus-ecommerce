import { create } from 'zustand';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: {
    id: string;
    email: string;
    roles: string[];
  } | null;
  setAuth: (token: string, refreshToken: string, user: any) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Load initial state from localStorage safely in SSR
  const isClient = typeof window !== 'undefined';
  const token = isClient ? localStorage.getItem('token') : null;
  const refreshToken = isClient ? localStorage.getItem('refreshToken') : null;
  const userStr = isClient ? localStorage.getItem('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;

  return {
    token,
    refreshToken,
    user,
    setAuth: (token, refreshToken, user) => {
      if (isClient) {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
      }
      set({ token, refreshToken, user });
    },
    clearAuth: () => {
      if (isClient) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
      set({ token: null, refreshToken: null, user: null });
    },
  };
});
