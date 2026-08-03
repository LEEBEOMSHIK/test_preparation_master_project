import apiClient from './apiClient';
import type { ApiResponse } from '@/types';

export interface DashboardStats {
  todayLoginCount: number;
  todayInquiryCount: number;
  pendingInquiryCount: number;
  pendingBugCount: number;
  totalExamCount: number;
  totalMemberCount: number;
  todayExamAttemptCount: number;
  todayQuizAttemptCount: number;
}

export interface DayCount {
  date: string;
  count: number;
}

export interface DashboardTrend {
  loginTrend: DayCount[];
  examTrend: DayCount[];
  inquiryTrend: DayCount[];
  quizTrend: DayCount[];
}

export const adminDashboardService = {
  getStats: () =>
    apiClient.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats'),
  getTrend: (days: 7 | 30 | 90 = 7) =>
    apiClient.get<ApiResponse<DashboardTrend>>('/admin/dashboard/trend', { params: { days } }),
};
