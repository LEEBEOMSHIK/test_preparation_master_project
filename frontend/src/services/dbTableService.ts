import apiClient from './apiClient';
import type { ApiResponse } from '@/types';

export interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  is_identity: string | null;
}

export interface TableRowsResponse {
  content: Record<string, unknown>[];
  totalElements: number;
  page: number;
  size: number;
}

export const dbTableService = {
  listTables: () =>
    apiClient.get<ApiResponse<string[]>>('/admin/db-tables'),

  getColumns: (tableName: string) =>
    apiClient.get<ApiResponse<TableColumn[]>>(`/admin/db-tables/${tableName}/columns`),

  getRows: (tableName: string, page = 0, size = 20) =>
    apiClient.get<ApiResponse<TableRowsResponse>>(`/admin/db-tables/${tableName}/rows`, {
      params: { page, size },
    }),

  insertRow: (tableName: string, row: Record<string, unknown>) =>
    apiClient.post<ApiResponse<void>>(`/admin/db-tables/${tableName}/rows`, row),

  updateRow: (tableName: string, pk: string | number, row: Record<string, unknown>) =>
    apiClient.put<ApiResponse<void>>(`/admin/db-tables/${tableName}/rows/${pk}`, row),

  deleteRow: (tableName: string, pk: string | number) =>
    apiClient.delete<ApiResponse<void>>(`/admin/db-tables/${tableName}/rows/${pk}`),
};
