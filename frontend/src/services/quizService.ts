import apiClient from './apiClient';
import type { ApiResponse, DomainMaster, SchedulingData } from '@/types';

export interface QuizQuestion {
  id: number;
  title?: string;
  content: string;
  /** 발문(지시문) — 문항 내용 위에 강조 표시용 (선택) */
  instruction?: string;
  questionType: string;
  options?: string[];
  code?: string;
  language?: string;
  examYear?: number;
  examRound?: number;
  /** CPU 스케줄링 구조화 데이터 (SCHEDULING 유형에서만 존재) */
  schedulingData?: SchedulingData;
}

export interface CheckResult {
  correct: boolean;
  answer: string;
  explanation?: string;
}

export const quizService = {
  getCategories: (examTypeIds?: number[]) =>
    apiClient.get<ApiResponse<DomainMaster[]>>('/user/quiz/categories', {
      params: examTypeIds && examTypeIds.length > 0
        ? { examTypeIds: examTypeIds.join(',') }
        : undefined,
    }),

  getQuestions: (categoryId: number, limit = 10) =>
    apiClient.get<ApiResponse<QuizQuestion[]>>('/user/quiz/questions', {
      params: { categoryId, limit },
    }),

  checkAnswer: (questionId: number, userAnswer: string) =>
    apiClient.post<ApiResponse<CheckResult>>('/user/quiz/check', { questionId, userAnswer }),
};
