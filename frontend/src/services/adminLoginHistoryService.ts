import apiClient from './apiClient';
import type { ApiResponse } from '@/types';

export interface LoginHistoryItem {
  id: number;
  no: number;
  memberName: string;
  email: string;
  ipAddress: string;
  userAgent: string | null;
  loginAt: string;
}

export interface LoginHistoryPage {
  content: LoginHistoryItem[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface LoginHistoryParams {
  keyword?: string;
  type?: 'name' | 'email' | 'ip';
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export const adminLoginHistoryService = {
  getList: (params: LoginHistoryParams) =>
    apiClient.get<ApiResponse<LoginHistoryPage>>('/admin/login-history', { params }),
};
