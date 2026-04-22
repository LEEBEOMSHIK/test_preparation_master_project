import apiClient from './apiClient';
import type { ApiResponse, PageResponse, Faq } from '@/types';

export interface FaqRequest {
  question: string;
  answer: string;
  isActive: boolean;
  displayOrder: number;
}

export const faqService = {
  // User
  getFaqs: () =>
    apiClient.get<ApiResponse<Faq[]>>('/user/faq'),

  // Admin
  adminGetAll: (page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<Faq>>>('/admin/faq', { params: { page, size } }),

  adminCreate: (data: FaqRequest) =>
    apiClient.post<ApiResponse<Faq>>('/admin/faq', data),

  adminUpdate: (id: number, data: FaqRequest) =>
    apiClient.put<ApiResponse<Faq>>(`/admin/faq/${id}`, data),

  adminToggleActive: (id: number) =>
    apiClient.patch<ApiResponse<Faq>>(`/admin/faq/${id}/toggle-active`),

  adminDelete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/admin/faq/${id}`),
};
