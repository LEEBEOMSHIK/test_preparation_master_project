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

  /** 현재 로그인 사용자의 권한에 맞는 메뉴 트리 반환 (GET /menus/mine) */
  getMyMenus: (menuType: 'USER' | 'ADMIN') =>
    apiClient.get<ApiResponse<MenuConfig[]>>('/menus/mine', { params: { menuType } }),

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
