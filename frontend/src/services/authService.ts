import apiClient from './apiClient';
import type { ApiResponse, AuthTokens, User } from '@/types';

export const authService = {
  signup: (email: string, password: string, name: string) =>
    apiClient.post<ApiResponse<void>>('/auth/signup', { email, password, name }),

  login: (email: string, password: string) =>
    apiClient.post<ApiResponse<AuthTokens & { user: User }>>('/auth/login', { email, password }),

  logout: () =>
    apiClient.post<ApiResponse<void>>('/auth/logout'),

  refresh: () =>
    apiClient.post<ApiResponse<AuthTokens>>('/auth/refresh'),

  me: () =>
    apiClient.get<ApiResponse<User>>('/auth/me'),
};
