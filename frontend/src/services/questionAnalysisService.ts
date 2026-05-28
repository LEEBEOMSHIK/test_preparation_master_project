import apiClient from './apiClient';
import type { ApiResponse } from '@/types';

export interface QuestionAnalysis {
  keywords:   string[];
  domains:    string[];
  difficulty: '하' | '중' | '상';
  summary:    string;
}

export interface RegenerateRequest {
  keywords:        string[];
  domains:         string[];
  difficulty:      string;
  originalContent: string;
}

export interface QuestionRegenerate {
  content: string;
}

export const questionAnalysisService = {
  analyze: (content: string) =>
    apiClient.post<ApiResponse<QuestionAnalysis>>('/admin/questions/analyze', { content }),

  regenerate: (data: RegenerateRequest) =>
    apiClient.post<ApiResponse<QuestionRegenerate>>('/admin/questions/regenerate', data),
};
