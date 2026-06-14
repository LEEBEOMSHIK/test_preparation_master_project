import apiClient from './apiClient';
import type { ApiResponse } from '@/types';

export interface NotionStatus {
  configured: boolean;   // 서버에 client id/secret 설정 여부
  connected: boolean;    // 현재 사용자의 워크스페이스 연결 여부
  workspaceName: string | null;
}

export interface NotionExportResult {
  notionPageId: string;
  url: string;
}

export const notionService = {
  /** 연동 상태 조회 */
  getStatus: () =>
    apiClient.get<ApiResponse<NotionStatus>>('/user/notion/status'),

  /** OAuth 인가 URL 조회 (브라우저를 이 URL로 이동시켜 연결) */
  getAuthorizeUrl: () =>
    apiClient.get<ApiResponse<{ url: string }>>('/user/notion/authorize-url'),

  /** 연동 해제 */
  disconnect: () =>
    apiClient.delete<ApiResponse<void>>('/user/notion'),

  /** 개념노트를 Notion으로 내보내기 (생성/갱신) */
  exportNote: (noteId: number) =>
    apiClient.post<ApiResponse<NotionExportResult>>(`/user/notion/export/${noteId}`),
};
