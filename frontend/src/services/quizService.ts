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
  /** 문항 카테고리명 — "AI 커스텀 전체" 등 여러 카테고리가 섞여 출제되는 모드에서 배지 표시용 */
  categoryName?: string;
}

export interface CheckResult {
  correct: boolean;
  answer: string;
  explanation?: string;
  /** true면 answer의 `||`를 대체 정답 구분자로 해석하지 않음(코드 조건의 논리 OR 보호용) */
  disableAlternativeAnswer?: boolean;
}

export const quizService = {
  getCategories: (examTypeIds?: number[]) =>
    apiClient.get<ApiResponse<DomainMaster[]>>('/user/quiz/categories', {
      params: examTypeIds && examTypeIds.length > 0
        ? { examTypeIds: examTypeIds.join(',') }
        : undefined,
    }),

  /** categoryId를 생략(undefined)하면 카테고리 구분 없는 전체 랜덤 출제 — AI 커스텀 통합 카드 전용
   *  excludeIds: 세션 내 이전 라운드에서 이미 출제된 문항 ID 목록 — 있으면 다음 라운드 출제에서 제외(콤마 조인 전송) */
  getQuestions: (categoryId: number | undefined, limit = 10, language?: string, source?: string, excludeIds?: number[]) =>
    apiClient.get<ApiResponse<QuizQuestion[]>>('/user/quiz/questions', {
      params: {
        ...(categoryId !== undefined ? { categoryId } : {}),
        limit,
        ...(language ? { language } : {}),
        ...(source ? { source } : {}),
        ...(excludeIds && excludeIds.length > 0 ? { excludeIds: excludeIds.join(',') } : {}),
      },
    }),

  checkAnswer: (questionId: number, userAnswer: string) =>
    apiClient.post<ApiResponse<CheckResult>>('/user/quiz/check', { questionId, userAnswer }),

  /** 사용자가 복습 표시(북마크)한 문항 전체 (재풀이 모드용, 정답 미노출) */
  getBookmarkedQuestions: () =>
    apiClient.get<ApiResponse<QuizQuestion[]>>('/user/quiz/bookmarked-questions'),
};
