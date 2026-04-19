import apiClient from './apiClient';
import type { ApiResponse, ExamDetail, ExamSummary, PageResponse, QuestionSummary, QuestionType } from '@/types';

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

  adminCreateExamWithQuestions: (
    title: string,
    questionMode: 'RANDOM' | 'SEQUENTIAL',
    questions: Record<string, unknown>[],
  ) =>
    apiClient.post<ApiResponse<ExamSummary>>('/admin/exams/with-questions', {
      title,
      questionMode,
      questions,
    }),

  adminUpdateExam: (id: number, data: Partial<{ title: string; questionMode: string }>) =>
    apiClient.put<ApiResponse<ExamSummary>>(`/admin/exams/${id}`, data),

  adminDeleteExam: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/admin/exams/${id}`),

  adminAddQuestion: (examId: number, question: Record<string, unknown>) =>
    apiClient.post<ApiResponse<void>>(`/admin/exams/${examId}/questions`, question),

  adminGetExam: (id: number) =>
    apiClient.get<ApiResponse<ExamSummary>>(`/admin/exams/${id}`),

  adminAddQuestionsBulk: (examId: number, questions: Record<string, unknown>[]) =>
    apiClient.post<ApiResponse<void>>(`/admin/exams/${examId}/questions/bulk`, questions),

  adminGetExamQuestions: (examId: number) =>
    apiClient.get<ApiResponse<QuestionSummary[]>>(`/admin/exams/${examId}/questions`),

  adminRemoveQuestion: (examId: number, questionId: number) =>
    apiClient.delete<ApiResponse<void>>(`/admin/exams/${examId}/questions/${questionId}`),

  adminUploadQuestions: (examId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<ApiResponse<{ imported: number }>>(`/admin/exams/${examId}/questions/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  adminUploadQuestionImage: (image: File) => {
    const form = new FormData();
    form.append('image', image);
    return apiClient.post<ApiResponse<{ url: string }>>('/admin/questions/images', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Question bank (global)
  adminGetQuestions: (page = 0, size = 50) =>
    apiClient.get<ApiResponse<PageResponse<QuestionSummary>>>('/admin/questions', { params: { page, size } }),

  adminGetQuestion: (id: number) =>
    apiClient.get<ApiResponse<QuestionSummary>>(`/admin/questions/${id}`),

  adminCreateQuestionsBulk: (questions: Array<{
    content: string;
    questionType: QuestionType;
    categoryId: number;
    options?: string[];
    answer?: string;
    code?: string;
    language?: string;
    explanation?: string;
  }>) =>
    apiClient.post<ApiResponse<{ created: number }>>('/admin/questions/bulk', { questions }),

  adminDeleteQuestion: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/admin/questions/${id}`),

  adminUpdateQuestion: (id: number, data: {
    content: string;
    questionType: QuestionType;
    options?: string[];
    answer?: string;
    code?: string;
    language?: string;
    explanation?: string;
  }) =>
    apiClient.put<ApiResponse<QuestionSummary>>(`/admin/questions/${id}`, data),
};
