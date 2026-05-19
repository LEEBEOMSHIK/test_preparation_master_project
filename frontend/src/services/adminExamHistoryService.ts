import apiClient from './apiClient';
import type { ApiResponse } from '@/types';

export interface ExamHistoryItem {
  id: number;
  no: number;
  userName: string;
  userEmail: string;
  examinationTitle: string;
  totalQuestions: number;
  correctCount: number;
  score: number;
  takenAt: string;
}

export interface ExamHistoryPage {
  content: ExamHistoryItem[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface ExamHistoryParams {
  keyword?: string;
  type?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export const adminExamHistoryService = {
  getList: (params: ExamHistoryParams) =>
    apiClient.get<ApiResponse<ExamHistoryPage>>('/admin/exam-history', { params }),
};
