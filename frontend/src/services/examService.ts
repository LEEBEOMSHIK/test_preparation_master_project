import apiClient from './apiClient';
import type { ApiResponse, ExamQuestionSyncPreview, ExaminationSubmitResult, ExamQuestion, ExamSummary, PageResponse, QuestionSummary, QuestionType, SchedulingData, SqlData } from '@/types';

export const examService = {
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
    apiClient.get<ApiResponse<ExamQuestion[]>>(`/admin/exams/${examId}/questions`),

  adminGetQuestionSyncPreview: (examId: number) =>
    apiClient.get<ApiResponse<ExamQuestionSyncPreview>>(`/admin/exams/${examId}/questions/sync-preview`),

  adminSyncQuestions: (
    examId: number,
    selections: Array<{ questionId: number; sourceQuestionBankId: number }>,
    applyAnswers: boolean,
    answerConfirmation?: string,
  ) =>
    apiClient.post<ApiResponse<ExamQuestionSyncPreview>>(`/admin/exams/${examId}/questions/sync`, {
      selections,
      applyAnswers,
      answerConfirmation,
    }),

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
    title?: string;
    examYear?: number;
    examRound?: number;
    questionNo?: number;
    content: string;
    /** 발문(지시문) — 문항 내용과 분리 저장 (선택) */
    instruction?: string;
    questionType: QuestionType;
    categoryId?: number;
    examTypeId?: number;
    options?: string[];
    answer?: string;
    code?: string;
    language?: string;
    explanation?: string;
    aiKeywords?: string[];
    aiDomains?: string[];
    aiDifficulty?: string;
    aiSummary?: string;
    schedulingData?: SchedulingData;
    sqlData?: SqlData;
  }>) =>
    apiClient.post<ApiResponse<{ created: number }>>('/admin/questions/bulk', { questions }),

  adminDeleteQuestion: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/admin/questions/${id}`),

  adminUpdateQuestion: (id: number, data: {
    title?: string;
    examYear?: number;
    examRound?: number;
    questionNo?: number;
    content: string;
    /** 발문(지시문) — 문항 내용과 분리 저장 (선택) */
    instruction?: string;
    questionType: QuestionType;
    categoryId?: number;
    examTypeId?: number;
    options?: string[];
    answer?: string;
    code?: string;
    language?: string;
    explanation?: string;
    aiKeywords?: string[];
    aiDomains?: string[];
    aiDifficulty?: string;
    aiSummary?: string;
    schedulingData?: SchedulingData;
    sqlData?: SqlData;
  }) =>
    apiClient.put<ApiResponse<QuestionSummary>>(`/admin/questions/${id}`, data),
};
