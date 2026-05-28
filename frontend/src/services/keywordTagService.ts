import apiClient from './apiClient';
import type { ApiResponse } from '@/types';

export interface KeywordTag {
  id:       number;
  name:     string;
  type:     'KEYWORD' | 'DOMAIN';
  useCount: number;
}

export const keywordTagService = {
  saveBulk: (keywords: string[], domains: string[]) =>
    apiClient.post<ApiResponse<{ saved: number }>>('/admin/keyword-tags/bulk', { keywords, domains }),

  search: (type: 'KEYWORD' | 'DOMAIN', q?: string) =>
    apiClient.get<ApiResponse<KeywordTag[]>>('/admin/keyword-tags', { params: { type, q } }),
};
