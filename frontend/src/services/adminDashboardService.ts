import apiClient from './apiClient';
import type { ApiResponse } from '@/types';

export interface DashboardStats {
  todayLoginCount: number;
  todayInquiryCount: number;
  pendingInquiryCount: number;
  totalExamCount: number;
  totalMemberCount: number;
  todayExamAttemptCount: number;
}

export const adminDashboardService = {
  getStats: () =>
    apiClient.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats'),
};
