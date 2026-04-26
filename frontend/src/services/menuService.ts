import apiClient from './apiClient';
import type { ApiResponse, MenuConfig } from '@/types';

export interface MenuConfigRequest {
  parentId?: number;
  name: string;
  url: string;
  iconKey?: string;
  displayOrder: number;
  menuType: 'USER' | 'ADMIN';
  isActive: boolean;
  allowedRoles?: string;
}

export const menuService = {
  getMenuTree: (menuType: 'USER' | 'ADMIN') =>
    apiClient.get<ApiResponse<MenuConfig[]>>('/menus', { params: { menuType } }),

  adminGetAll: (menuType: 'USER' | 'ADMIN') =>
    apiClient.get<ApiResponse<MenuConfig[]>>('/admin/menus', {
      params: { menuType, treeView: true },
    }),

  adminGetFlat: (menuType: 'USER' | 'ADMIN') =>
    apiClient.get<ApiResponse<MenuConfig[]>>('/admin/menus', {
      params: { menuType, treeView: false },
    }),

  create: (data: MenuConfigRequest) =>
    apiClient.post<ApiResponse<MenuConfig>>('/admin/menus', data),

  update: (id: number, data: MenuConfigRequest) =>
    apiClient.put<ApiResponse<MenuConfig>>(`/admin/menus/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/admin/menus/${id}`),
};
