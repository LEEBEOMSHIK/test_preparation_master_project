import apiClient from './apiClient';
import type { ApiResponse, PageResponse, Inquiry, InquiryStatus, InquiryRequestType, InquiryMessage } from '@/types';

export interface InquiryRequest {
  title: string;
  content: string;
  requestType: InquiryRequestType;
  targetArea?: string;
  detailLocation?: string;
  attachmentIds: number[];
}

export interface UploadImageResult {
  id: number;
  url: string;
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
    return apiClient.post<ApiResponse<UploadImageResult>>('/user/inquiries/images', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadMessageImage: (file: File) => {
    const form = new FormData(); form.append('image', file);
    return apiClient.post<ApiResponse<UploadImageResult>>('/user/inquiries/messages/images', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  addMessage: (id: number, content: string, attachmentIds: number[]) =>
    apiClient.post<ApiResponse<InquiryMessage>>(`/user/inquiries/${id}/messages`, { content, attachmentIds }),

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

  adminDelete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/admin/inquiries/${id}`),

  adminAddMessage: (id: number, content: string, attachmentIds: number[], sendEmail = false) =>
    apiClient.post<ApiResponse<InquiryMessage>>(`/admin/inquiries/${id}/messages`, { content, attachmentIds, sendEmail }),
};
