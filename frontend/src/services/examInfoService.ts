import apiClient from './apiClient';
import type { ApiResponse, ExamInfo, User } from '@/types';

export interface ExamTypeOption {
  id: number;
  masterId: number;
  name: string;
  displayOrder: number;
}

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
  getExamTypes: () =>
    apiClient.get<ApiResponse<ExamTypeOption[]>>('/user/exam-types'),

  getMyExamInfo: () =>
    apiClient.get<ApiResponse<ExamInfo[]>>('/user/exam-info'),

  completeOnboarding: (slaveIds: number[]) =>
    apiClient.post<ApiResponse<User>>('/user/onboarding', { slaveIds }),

  updateInterests: (slaveIds: number[]) =>
    apiClient.put<ApiResponse<User>>('/user/exam-info/interests', { slaveIds }),
};
