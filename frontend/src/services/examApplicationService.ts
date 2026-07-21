import apiClient from './apiClient';
import type { ApiResponse, UserExamApplication } from '@/types';

export interface UserExamApplicationRequest {
  examInfoId?: number;
  examName: string;
  applicationDate?: string;
  examDate?: string;
  memo?: string;
}

export const examApplicationService = {
  getMine: () =>
    apiClient.get<ApiResponse<UserExamApplication[]>>('/user/exam-applications'),

  create: (data: UserExamApplicationRequest) =>
    apiClient.post<ApiResponse<UserExamApplication>>('/user/exam-applications', data),

  update: (id: number, data: UserExamApplicationRequest) =>
    apiClient.put<ApiResponse<UserExamApplication>>(`/user/exam-applications/${id}`, data),

  remove: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/user/exam-applications/${id}`),
};
