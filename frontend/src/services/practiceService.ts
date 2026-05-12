import apiClient from './apiClient';
import type { ApiResponse } from '@/types';

export type SqlResult = {
  type: string;
  columns: string[];
  rows: string[][];
  rowCount: number;
  message: string;
  success: boolean;
  errorPosition?: number | null;
  simulated?: boolean;
};

export interface TypoPattern {
  typo: string;
  correction: string;
}

export interface ConversionRule {
  id: number;
  dialect: string;
  ruleKey: string;
  userLabel: string;
  enabled: boolean;
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

export const practiceService = {
  executeSql: (sql: string, dialect: string) =>
    apiClient.post<ApiResponse<SqlResult>>('/user/practice/sql/execute', { sql, dialect }),

  resetData: () =>
    apiClient.post<ApiResponse<string>>('/user/practice/sql/reset'),

  getRules: () =>
    apiClient.get<ApiResponse<PracticeRules>>('/user/practice/rules'),
};
