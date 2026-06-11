import apiClient from './apiClient';
import type { ApiResponse, BookmarkQuestion } from '@/types';

export const bookmarkService = {
  /** 북마크 토글 — { bookmarked: true } 또는 { bookmarked: false } */
  toggle: (questionBankId: number) =>
    apiClient.post<ApiResponse<{ bookmarked: boolean }>>('/user/bookmarks/toggle', { questionBankId }),

  /** 북마크 목록 조회 */
  getBookmarks: () =>
    apiClient.get<ApiResponse<BookmarkQuestion[]>>('/user/bookmarks'),

  /** 북마크된 questionBankId 목록만 조회 (퀴즈 화면 별 표시용) */
  getBookmarkedIds: () =>
    apiClient.get<ApiResponse<number[]>>('/user/bookmarks/ids'),
};
