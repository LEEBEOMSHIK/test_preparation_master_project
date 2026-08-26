import apiClient from './apiClient';
import type {
  ApiResponse,
  PageResponse,
  PatchNote,
  PatchNotePublicationRequest,
  PatchNoteRequest,
} from '@/types';

export const patchNoteService = {
  // User
  getPatchNotes: (page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<PatchNote>>>('/user/patch-notes', { params: { page, size } }),

  // Admin
  adminGetAll: (page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<PatchNote>>>('/admin/patch-notes', { params: { page, size } }),

  adminGetById: (id: number) =>
    apiClient.get<ApiResponse<PatchNote>>(`/admin/patch-notes/${id}`),

  adminCreate: (data: PatchNoteRequest) =>
    apiClient.post<ApiResponse<PatchNote>>('/admin/patch-notes', data),

  adminUpdate: (id: number, data: PatchNoteRequest) =>
    apiClient.put<ApiResponse<PatchNote>>(`/admin/patch-notes/${id}`, data),

  adminUpdatePublication: (id: number, data: PatchNotePublicationRequest) =>
    apiClient.patch<ApiResponse<PatchNote>>(`/admin/patch-notes/${id}/publication`, data),

  adminDelete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/admin/patch-notes/${id}`),
};
