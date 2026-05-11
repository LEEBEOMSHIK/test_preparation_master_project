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

export const practiceService = {
  executeSql: (sql: string, dialect: string) =>
    apiClient.post<ApiResponse<SqlResult>>('/user/practice/sql/execute', { sql, dialect }),

  resetData: () =>
    apiClient.post<ApiResponse<string>>('/user/practice/sql/reset'),
};
