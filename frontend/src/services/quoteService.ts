import apiClient from './apiClient';
import type { ApiResponse, PageResponse, Quote } from '@/types';

export const quoteService = {
  // Admin
  adminGetAll: (page = 0, size = 20) =>
    apiClient.get<ApiResponse<PageResponse<Quote>>>('/admin/quotes', { params: { page, size } }),

  adminCreate: (content: string, author?: string) =>
    apiClient.post<ApiResponse<Quote>>('/admin/quotes', { content, author }),

  adminUpdate: (id: number, content: string, author?: string) =>
    apiClient.put<ApiResponse<Quote>>(`/admin/quotes/${id}`, { content, author }),

  adminToggleUseYn: (id: number) =>
    apiClient.patch<ApiResponse<Quote>>(`/admin/quotes/${id}/toggle`),

  adminDelete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/admin/quotes/${id}`),

  // User
  getRandom: () =>
    apiClient.get<ApiResponse<Quote | null>>('/user/quotes/random'),
};
