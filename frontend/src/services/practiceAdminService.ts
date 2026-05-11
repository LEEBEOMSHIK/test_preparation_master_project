import apiClient from './apiClient';
import type { ApiResponse } from '@/types';

export interface PracticeHistoryItem {
  id: number;
  userEmail: string;
  sqlContent: string;
  resultType: string;
  rowCount: number | null;
  errorMessage: string | null;
  executedAt: string;
}

export interface PracticeHistoryPage {
  content: PracticeHistoryItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

export interface TypoPattern {
  typo: string;
  correction: string;
}

export interface PracticeRules {
  blockedCommands: string[];
  allowedTablePrefix: string;
  multiStatementRule: string;
  typoPatterns: TypoPattern[];
}

export const practiceAdminService = {
  getHistory: (page = 0, size = 20, email?: string) =>
    apiClient.get<ApiResponse<PracticeHistoryPage>>('/admin/practice/history', {
      params: { page, size, ...(email && email.trim() ? { email: email.trim() } : {}) },
    }),

  getRules: () =>
    apiClient.get<ApiResponse<PracticeRules>>('/admin/practice/rules'),
};
