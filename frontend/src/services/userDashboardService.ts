import apiClient from './apiClient';
import type { ApiResponse, UserDashboardData } from '@/types';

export type DashboardPeriod = 7 | 30 | 0;

export const userDashboardService = {
  getStats: (days: DashboardPeriod = 30) =>
    apiClient.get<ApiResponse<UserDashboardData>>('/user/dashboard/stats', {
      params: { days },
    }),
};
