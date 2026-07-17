import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  updateUser: (partial: Partial<User>) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (user, accessToken) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('accessToken', accessToken);
      // refresh 응답이 다른 계정으로 뒤바뀌었는지 검증하기 위한 기준값 (apiClient.ts refreshAccessToken 참고)
      sessionStorage.setItem('authEmail', user.email);
    }
    set({ user, accessToken, isAuthenticated: true });
  },
  updateUser: (partial) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : state.user,
    }));
  },
  clearAuth: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('authEmail');
      localStorage.removeItem('tpmp_quote_hidden_until');
    }
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
}));
