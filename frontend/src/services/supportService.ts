import apiClient from './apiClient';
import type { ApiResponse, SupportSettings } from '@/types';

export const supportService = {
  // User
  getSupportSettings: () =>
    apiClient.get<ApiResponse<SupportSettings>>('/user/support-settings'),

  // Admin
  adminGetSupportSettings: () =>
    apiClient.get<ApiResponse<SupportSettings>>('/admin/support-settings'),

  adminUpdateSupportSettings: (payload: SupportSettings) =>
    apiClient.put<ApiResponse<SupportSettings>>('/admin/support-settings', payload),
};
