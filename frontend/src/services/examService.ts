import apiClient from './apiClient';
import type { ApiResponse, ExamDetail, ExamSummary, PageResponse } from '@/types';

export const examService = {
  // User
  getExams: (page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<ExamSummary>>>('/user/exams', { params: { page, size } }),

  getExamDetail: (id: number) =>
    apiClient.get<ApiResponse<ExamDetail>>(`/user/exams/${id}`),

  submitExam: (id: number, answers: Record<number, string>) =>
    apiClient.post<ApiResponse<{ score: number }>>(`/user/exams/${id}/submit`, { answers }),

  // Admin
  adminGetExams: (page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<ExamSummary>>>('/admin/exams', { params: { page, size } }),

  adminCreateExam: (title: string, questionMode: 'RANDOM' | 'SEQUENTIAL') =>
    apiClient.post<ApiResponse<ExamSummary>>('/admin/exams', { title, questionMode }),

  adminUpdateExam: (id: number, data: Partial<{ title: string; questionMode: string }>) =>
    apiClient.put<ApiResponse<ExamSummary>>(`/admin/exams/${id}`, data),

  adminDeleteExam: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/admin/exams/${id}`),

  adminAddQuestion: (examId: number, question: Record<string, unknown>) =>
    apiClient.post<ApiResponse<void>>(`/admin/exams/${examId}/questions`, question),

  adminAddQuestionsBulk: (examId: number, questions: Record<string, unknown>[]) =>
    apiClient.post<ApiResponse<void>>(`/admin/exams/${examId}/questions/bulk`, { questions }),

  adminUploadQuestions: (examId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<ApiResponse<{ imported: number }>>(`/admin/exams/${examId}/questions/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
