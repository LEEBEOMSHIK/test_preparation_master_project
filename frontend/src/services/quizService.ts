import apiClient from './apiClient';
import type { ApiResponse, DomainMaster } from '@/types';

export interface QuizQuestion {
  id: number;
  content: string;
  questionType: string;
  options?: string[];
  code?: string;
  language?: string;
}

export interface CheckResult {
  correct: boolean;
  answer: string;
  explanation?: string;
}

export const quizService = {
  getCategories: () =>
    apiClient.get<ApiResponse<DomainMaster[]>>('/user/quiz/categories'),

  getQuestions: (categoryId: number, limit = 10) =>
    apiClient.get<ApiResponse<QuizQuestion[]>>('/user/quiz/questions', {
      params: { categoryId, limit },
    }),

  checkAnswer: (questionId: number, userAnswer: string) =>
    apiClient.post<ApiResponse<CheckResult>>('/user/quiz/check', { questionId, userAnswer }),
};
