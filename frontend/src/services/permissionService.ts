import apiClient from './apiClient';
import type { ApiResponse, PermissionMaster, PermissionDetail, PermissionScope } from '@/types';

export interface PermissionMasterRequest {
  code: string;
  name: string;
  description?: string;
  scope: PermissionScope;
}

export interface PermissionDetailRequest {
  masterId: number;
  name: string;
  description?: string;
  code?: string;
}

export const permissionService = {
  getAll: () =>
    apiClient.get<ApiResponse<PermissionMaster[]>>('/admin/permissions'),

  getOne: (id: number) =>
    apiClient.get<ApiResponse<PermissionMaster>>(`/admin/permissions/${id}`),

  createMaster: (data: PermissionMasterRequest) =>
    apiClient.post<ApiResponse<PermissionMaster>>('/admin/permissions/masters', data),

  updateMaster: (id: number, data: PermissionMasterRequest) =>
    apiClient.put<ApiResponse<PermissionMaster>>(`/admin/permissions/masters/${id}`, data),

  deleteMaster: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/admin/permissions/masters/${id}`),

  updateMenuAccess: (id: number, menuIds: number[]) =>
    apiClient.put<ApiResponse<void>>(`/admin/permissions/masters/${id}/menus`, menuIds),

  createDetail: (data: PermissionDetailRequest) =>
    apiClient.post<ApiResponse<PermissionDetail>>('/admin/permissions/details', data),

  updateDetail: (id: number, data: PermissionDetailRequest) =>
    apiClient.put<ApiResponse<PermissionDetail>>(`/admin/permissions/details/${id}`, data),

  deleteDetail: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/admin/permissions/details/${id}`),

  getDetailMenuAccess: (id: number) =>
    apiClient.get<ApiResponse<number[]>>(`/admin/permissions/details/${id}/menus`),

  updateDetailMenuAccess: (id: number, menuIds: number[]) =>
    apiClient.put<ApiResponse<void>>(`/admin/permissions/details/${id}/menus`, menuIds),
};
