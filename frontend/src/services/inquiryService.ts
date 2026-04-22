import apiClient from './apiClient';
import type { ApiResponse, PageResponse, Inquiry, InquiryStatus, InquiryType } from '@/types';

export interface InquiryRequest {
  title: string;
  content: string;
  inquiryType: InquiryType;
  imageUrls: string[];
}

export const inquiryService = {
  // User
  getMyInquiries: (page = 0, size = 10, status?: InquiryStatus) =>
    apiClient.get<ApiResponse<PageResponse<Inquiry>>>('/user/inquiries', {
      params: { page, size, ...(status ? { status } : {}) },
    }),

  getMyInquiry: (id: number) =>
    apiClient.get<ApiResponse<Inquiry>>(`/user/inquiries/${id}`),

  create: (data: InquiryRequest) =>
    apiClient.post<ApiResponse<Inquiry>>('/user/inquiries', data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/user/inquiries/${id}`),

  uploadImage: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return apiClient.post<ApiResponse<{ url: string }>>('/user/inquiries/images', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Admin
  adminGetAll: (page = 0, size = 10, status?: InquiryStatus) =>
    apiClient.get<ApiResponse<PageResponse<Inquiry>>>('/admin/inquiries', {
      params: { page, size, ...(status ? { status } : {}) },
    }),

  adminGetOne: (id: number) =>
    apiClient.get<ApiResponse<Inquiry>>(`/admin/inquiries/${id}`),

  adminReply: (id: number, reply: string) =>
    apiClient.put<ApiResponse<Inquiry>>(`/admin/inquiries/${id}/reply`, { reply }),

  adminToggleHold: (id: number) =>
    apiClient.patch<ApiResponse<Inquiry>>(`/admin/inquiries/${id}/hold`),
};
