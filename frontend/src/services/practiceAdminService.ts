import apiClient from './apiClient';
import type { ApiResponse } from '@/types';

export interface PracticeHistoryItem {
  id: number;
  userEmail: string;
  sqlContent: string;
  resultType: string;
  rowCount: number | null;
  errorMessage: string | null;
  dialect: string;
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

export interface ConversionRule {
  id: number;
  dialect: string;
  ruleKey: string;
  adminLabel: string;
  userLabel: string;
  enabled: boolean;
  displayOrder: number;
  complex: boolean;
}

export interface PracticeRules {
  blockedCommands: string[];
  allowedTablePrefix: string;
  multiStatementRule: string;
  typoPatterns: TypoPattern[];
  mysqlConversionRules: ConversionRule[];
  oracleConversionRules: ConversionRule[];
}

export interface HistoryFilters {
  email?: string;
  sqlContent?: string;
  resultType?: string;
  dialect?: string;
  date?: string;
}

export const practiceAdminService = {
  getHistory: (page = 0, size = 20, filters?: HistoryFilters) =>
    apiClient.get<ApiResponse<PracticeHistoryPage>>('/admin/practice/history', {
      params: {
        page,
        size,
        ...(filters?.email?.trim() ? { email: filters.email.trim() } : {}),
        ...(filters?.sqlContent?.trim() ? { sqlContent: filters.sqlContent.trim() } : {}),
        ...(filters?.resultType ? { resultType: filters.resultType } : {}),
        ...(filters?.dialect ? { dialect: filters.dialect } : {}),
        ...(filters?.date ? { date: filters.date } : {}),
      },
    }),

  getRules: () =>
    apiClient.get<ApiResponse<PracticeRules>>('/admin/practice/rules'),

  toggleConversionRule: (id: number) =>
    apiClient.patch<ApiResponse<ConversionRule>>(`/admin/practice/conversion-rules/${id}/toggle`),
};
