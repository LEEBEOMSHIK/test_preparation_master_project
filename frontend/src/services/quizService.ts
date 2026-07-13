import apiClient from './apiClient';
import type { ApiResponse, DomainMaster, SchedulingData, SqlData } from '@/types';

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
  /** SQL 구조화 데이터 (SQL 유형에서만 존재, 정답 유출 방지를 위해 expectedResult는 항상 제거됨) */
  sqlData?: SqlData;
  /** SQL 결과 테이블 정답의 컬럼명만 — 있으면 결과 테이블 입력 그리드 UI를 사용 (없으면 기존 텍스트/코드 입력) */
  sqlResultColumns?: string[];
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

  /** categoryId를 생략(undefined)하면 카테고리 구분 없는 전체 랜덤 출제 — AI 커스텀 통합 카드 전용 */
  getQuestions: (categoryId: number | undefined, limit = 10, language?: string, source?: string) =>
    apiClient.get<ApiResponse<QuizQuestion[]>>('/user/quiz/questions', {
      params: {
        ...(categoryId !== undefined ? { categoryId } : {}),
        limit,
        ...(language ? { language } : {}),
        ...(source ? { source } : {}),
      },
    }),

  checkAnswer: (questionId: number, userAnswer: string) =>
    apiClient.post<ApiResponse<CheckResult>>('/user/quiz/check', { questionId, userAnswer }),

  /** 사용자가 복습 표시(북마크)한 문항 전체 (재풀이 모드용, 정답 미노출) */
  getBookmarkedQuestions: () =>
    apiClient.get<ApiResponse<QuizQuestion[]>>('/user/quiz/bookmarked-questions'),
};
