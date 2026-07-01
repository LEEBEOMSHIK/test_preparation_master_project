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
  questionType?:   string;
  originalCode?:   string;
  language?:       string;
}

export interface QuestionRegenerate {
  content: string;
  code?:   string;
  answer?: string;
}

const AI_TIMEOUT = { timeout: 120_000 } as const;

export const questionAnalysisService = {
  analyze: (content: string, code?: string, language?: string) =>
    apiClient.post<ApiResponse<QuestionAnalysis>>('/admin/questions/analyze', { content, code, language }, AI_TIMEOUT),

  regenerate: (data: RegenerateRequest) =>
    apiClient.post<ApiResponse<QuestionRegenerate>>('/admin/questions/regenerate', data, AI_TIMEOUT),
};
