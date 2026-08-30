import type {
  ApiResponse,
  InquiryDetail,
  InquiryMessage,
  InquiryRequestType,
  InquiryStatus,
  InquirySummary,
  InquiryTargetArea,
  PageResponse,
} from '@/types';
import apiClient from './apiClient';

export interface InquiryRequest {
  title: string;
  content: string;
  requestType: InquiryRequestType;
  targetArea?: InquiryTargetArea;
  detailLocation?: string;
  attachmentIds: number[];
}

export interface InquiryUpdateRequest {
  title: string;
  content: string;
  requestType: InquiryRequestType;
  targetArea?: InquiryTargetArea;
  detailLocation?: string;
}

export interface UploadImageResult {
  id: number;
  url: string;
}

export interface InquiryNotificationSettings {
  enabled: boolean;
  recipientEmails: string[];
}

export type InquiryEmailDeliveryStatus = 'PENDING' | 'SENT' | 'FAILED';
export type InquiryEmailEventType =
  | 'NEW_INQUIRY'
  | 'USER_MESSAGE'
  | 'ADMIN_MESSAGE'
  | 'ANSWERED'
  | 'COMPLETED'
  | 'UNABLE_TO_PROCESS';

export interface InquiryEmailDelivery {
  id: number;
  inquiryId: number;
  inquiryMessageId: number | null;
  eventType: InquiryEmailEventType;
  status: InquiryEmailDeliveryStatus;
  recipientEmail: string;
  subject: string;
  attemptCount: number;
  lastError: string | null;
  createdAt: string;
  sentAt: string | null;
}

interface AdminInquiryFilters {
  status?: InquiryStatus;
  requestType?: InquiryRequestType;
  targetArea?: string;
  keyword?: string;
}

export const inquiryService = {
  getMyInquiries: (page = 0, size = 10, status?: InquiryStatus) =>
    apiClient.get<ApiResponse<PageResponse<InquirySummary>>>('/user/inquiries', {
      params: { page, size, ...(status ? { status } : {}) },
    }),

  getMyInquiry: (id: number) =>
    apiClient.get<ApiResponse<InquiryDetail>>(`/user/inquiries/${id}`),

  create: (data: InquiryRequest) =>
    apiClient.post<ApiResponse<InquiryDetail>>('/user/inquiries', data),

  update: (id: number, data: InquiryUpdateRequest) =>
    apiClient.put<ApiResponse<InquiryDetail>>(`/user/inquiries/${id}`, data),

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
    const form = new FormData();
    form.append('image', file);
    return apiClient.post<ApiResponse<UploadImageResult>>('/user/inquiries/messages/images', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  addMessage: (id: number, content: string, attachmentIds: number[]) =>
    apiClient.post<ApiResponse<InquiryMessage>>(`/user/inquiries/${id}/messages`, {
      content,
      attachmentIds,
    }),

  adminGetAll: (page = 0, size = 10, filters?: AdminInquiryFilters) =>
    apiClient.get<ApiResponse<PageResponse<InquirySummary>>>('/admin/inquiries', {
      params: { page, size, ...filters },
    }),

  adminGetOne: (id: number) =>
    apiClient.get<ApiResponse<InquiryDetail>>(`/admin/inquiries/${id}`),

  adminUpdateStatus: (
    id: number,
    status: InquiryStatus,
    message: string,
    sendEmail = false,
  ) =>
    apiClient.patch<ApiResponse<InquiryDetail>>(`/admin/inquiries/${id}/status`, {
      status,
      message,
      sendEmail,
    }),

  adminDelete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/admin/inquiries/${id}`),

  adminAddMessage: (
    id: number,
    content: string,
    attachmentIds: number[],
    sendEmail = false,
  ) =>
    apiClient.post<ApiResponse<InquiryMessage>>(`/admin/inquiries/${id}/messages`, {
      content,
      attachmentIds,
      sendEmail,
    }),

  getNotificationSettings: () =>
    apiClient.get<ApiResponse<InquiryNotificationSettings>>('/admin/inquiry-notification-settings'),

  updateNotificationSettings: (enabled: boolean, recipientEmails: string[]) =>
    apiClient.put<ApiResponse<InquiryNotificationSettings>>('/admin/inquiry-notification-settings', {
      enabled,
      recipientEmails,
    }),

  getEmailDeliveries: (
    inquiryId: number,
    page = 0,
    size = 20,
    status?: InquiryEmailDeliveryStatus,
  ) =>
    apiClient.get<ApiResponse<PageResponse<InquiryEmailDelivery>>>('/admin/inquiry-email-deliveries', {
      params: { inquiryId, page, size, ...(status ? { status } : {}) },
    }),

  retryEmailDelivery: (id: number) =>
    apiClient.post<ApiResponse<void>>(`/admin/inquiry-email-deliveries/${id}/retry`),
};
