import apiClient from './apiClient';
import type { ApiResponse, Examination, ExaminationDetail, PageResponse } from '@/types';

export const examinationService = {
  // ── 사용자 ──────────────────────────────────────────────────────────
  userGetExaminations: (page = 0, size = 500) =>
    apiClient.get<ApiResponse<PageResponse<Examination>>>('/user/examinations', {
      params: { page, size },
    }),

  userGetExaminationDetail: (id: number) =>
    apiClient.get<ApiResponse<ExaminationDetail>>(`/user/examinations/${id}`),

  userSubmitExamination: (id: number, answers: Record<number, string>) =>
    apiClient.post<ApiResponse<{ total: number; correct: number; score: number }>>(
      `/user/examinations/${id}/submit`,
      answers,
    ),

  // ── 관리자 ──────────────────────────────────────────────────────────
  /** 시험 목록 조회 */
  adminGetExaminations: (page = 0, size = 50) =>
    apiClient.get<ApiResponse<PageResponse<Examination>>>('/admin/examinations', {
      params: { page, size },
    }),

  /** 시험 단건 조회 */
  adminGetExamination: (id: number) =>
    apiClient.get<ApiResponse<Examination>>(`/admin/examinations/${id}`),

  /** 시험 등록 */
  adminCreateExamination: (data: {
    title: string;
    examPaperId: number;
    categoryId: number;
    timeLimit: number;
  }) =>
    apiClient.post<ApiResponse<Examination>>('/admin/examinations', data),

  /** 시험 수정 */
  adminUpdateExamination: (id: number, data: {
    title: string;
    examPaperId: number;
    categoryId: number;
    timeLimit: number;
  }) =>
    apiClient.put<ApiResponse<Examination>>(`/admin/examinations/${id}`, data),

  /** 시험 삭제 */
  adminDeleteExamination: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/admin/examinations/${id}`),
};
