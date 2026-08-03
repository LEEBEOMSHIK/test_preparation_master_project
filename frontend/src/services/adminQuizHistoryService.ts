import apiClient from './apiClient';
import type { ApiResponse } from '@/types';

export interface QuizHistoryItem {
  id: number;
  no: number;
  userName: string;
  userEmail: string;
  domainName?: string;
  questionContent?: string;
  questionType: string;
  userAnswer?: string;
  correct: boolean;
  createdAt: string;
}

export interface QuizHistoryPage {
  content: QuizHistoryItem[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface QuizHistoryParams {
  keyword?: string;
  type?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export const adminQuizHistoryService = {
  getList: (params: QuizHistoryParams) =>
    apiClient.get<ApiResponse<QuizHistoryPage>>('/admin/quiz-history', { params }),
};
