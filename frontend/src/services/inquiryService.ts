import apiClient from './apiClient';
import type { ApiResponse, PageResponse, InquiryDetail, InquirySummary, InquiryStatus, InquiryRequestType, InquiryMessage } from '@/types';

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
    apiClient.get<ApiResponse<PageResponse<InquirySummary>>>('/user/inquiries', {
      params: { page, size, ...(status ? { status } : {}) },
    }),

  getMyInquiry: (id: number) =>
    apiClient.get<ApiResponse<InquiryDetail>>(`/user/inquiries/${id}`),

  create: (data: InquiryRequest) =>
    apiClient.post<ApiResponse<InquiryDetail>>('/user/inquiries', data),

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
  adminGetAll: (page = 0, size = 10, params?: { status?: InquiryStatus; requestType?: InquiryRequestType; targetArea?: string; keyword?: string }) =>
    apiClient.get<ApiResponse<PageResponse<InquirySummary>>>('/admin/inquiries', {
      params: { page, size, ...params },
    }),

  adminGetOne: (id: number) =>
    apiClient.get<ApiResponse<InquiryDetail>>(`/admin/inquiries/${id}`),

  adminUpdateStatus: (id: number, status: InquiryStatus, message: string, sendEmail = false) =>
    apiClient.patch<ApiResponse<InquiryDetail>>(`/admin/inquiries/${id}/status`, { status, message, sendEmail }),

  adminDelete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/admin/inquiries/${id}`),

  adminAddMessage: (id: number, content: string, attachmentIds: number[], sendEmail = false) =>
    apiClient.post<ApiResponse<InquiryMessage>>(`/admin/inquiries/${id}/messages`, { content, attachmentIds, sendEmail }),
};
