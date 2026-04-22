import apiClient from './apiClient';
import type { ApiResponse, PageResponse, ConceptNote } from '@/types';

export interface ConceptNoteRequest {
  title: string;
  content: string;
  isPublic: boolean;
  questionId?: number;
  questionBankId?: number;
}

export const conceptNoteService = {
  // User
  getMyNotes: (page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<ConceptNote>>>('/user/concepts', { params: { page, size } }),

  getMyNote: (id: number) =>
    apiClient.get<ApiResponse<ConceptNote>>(`/user/concepts/${id}`),

  create: (data: ConceptNoteRequest) =>
    apiClient.post<ApiResponse<ConceptNote>>('/user/concepts', data),

  update: (id: number, data: ConceptNoteRequest) =>
    apiClient.put<ApiResponse<ConceptNote>>(`/user/concepts/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/user/concepts/${id}`),

  // Admin
  adminGetAll: (page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<ConceptNote>>>('/admin/concepts', { params: { page, size } }),

  adminTogglePublic: (id: number) =>
    apiClient.patch<ApiResponse<ConceptNote>>(`/admin/concepts/${id}/toggle-public`),

  adminDelete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/admin/concepts/${id}`),
};
