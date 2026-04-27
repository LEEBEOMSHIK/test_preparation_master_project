import apiClient from './apiClient';
import type { ApiResponse } from '@/types';

export interface GrantedPermissionInfo {
  id: number;
  name: string;
  code?: string;
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  grantedPermissions: GrantedPermissionInfo[];
}

export interface UserUpdateRequest {
  name: string;
  role: 'USER' | 'ADMIN';
}

export interface PasswordResetRequest {
  newPassword: string;
}

export const adminUserService = {
  getAll: (role?: string) =>
    apiClient.get<ApiResponse<AdminUser[]>>('/admin/users', { params: role ? { role } : undefined }),

  getOne: (id: number) =>
    apiClient.get<ApiResponse<AdminUser>>(`/admin/users/${id}`),

  update: (id: number, data: UserUpdateRequest) =>
    apiClient.put<ApiResponse<AdminUser>>(`/admin/users/${id}`, data),

  resetPassword: (id: number, data: PasswordResetRequest) =>
    apiClient.post<ApiResponse<void>>(`/admin/users/${id}/reset-password`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/admin/users/${id}`),

  getUserPermissions: (id: number) =>
    apiClient.get<ApiResponse<number[]>>(`/admin/users/${id}/permissions`),

  updateUserPermissions: (id: number, detailIds: number[]) =>
    apiClient.put<ApiResponse<void>>(`/admin/users/${id}/permissions`, detailIds),
};
