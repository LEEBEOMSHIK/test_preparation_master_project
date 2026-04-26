import apiClient from './apiClient';
import type { ApiResponse, ExamInfo, User } from '@/types';

export const examInfoService = {
  // Admin
  adminGetAll: () =>
    apiClient.get<ApiResponse<ExamInfo[]>>('/admin/exam-info'),

  adminCreate: (data: Partial<ExamInfo>) =>
    apiClient.post<ApiResponse<ExamInfo>>('/admin/exam-info', data),

  adminUpdate: (id: number, data: Partial<ExamInfo>) =>
    apiClient.put<ApiResponse<ExamInfo>>(`/admin/exam-info/${id}`, data),

  adminDelete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/admin/exam-info/${id}`),

  // User
  getMyExamInfo: () =>
    apiClient.get<ApiResponse<ExamInfo[]>>('/user/exam-info'),

  completeOnboarding: (examTypes: string[]) =>
    apiClient.post<ApiResponse<User>>('/user/onboarding', { examTypes }),

  updateInterests: (examTypes: string[]) =>
    apiClient.put<ApiResponse<User>>('/user/exam-info/interests', { examTypes }),
};
