import apiClient from './apiClient';
import type { ApiResponse, AuthTokens, RefreshResponse, User } from '@/types';

export const authService = {
  signup: (email: string, password: string, name: string) =>
    apiClient.post<ApiResponse<void>>('/auth/signup', { email, password, name }),

  login: (email: string, password: string) =>
    apiClient.post<ApiResponse<AuthTokens & { user: User }>>('/auth/login', { email, password }),

  logout: () =>
    apiClient.post<ApiResponse<void>>('/auth/logout'),

  // apiClient 인터셉터의 refreshAccessToken()과 별개 경로 — scope 판정 없이 기본(scope=user)으로 호출됨.
  // 실제 갱신은 인터셉터가 담당하므로 여기서는 응답 타입 정합성만 apiClient.ts와 맞춘다.
  refresh: () =>
    apiClient.post<ApiResponse<RefreshResponse>>('/auth/refresh'),

  me: () =>
    apiClient.get<ApiResponse<User>>('/auth/me'),
};
