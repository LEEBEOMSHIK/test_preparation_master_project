import apiClient from './apiClient';
import type { ApiResponse, DomainMaster, DomainSlave } from '@/types';

export const domainService = {
  /** 도메인 마스터 + 슬레이브 전체 조회 */
  getDomains: () =>
    apiClient.get<ApiResponse<DomainMaster[]>>('/admin/domains'),

  // ── 마스터 CRUD ──────────────────────────────────────────────────────────────

  createMaster: (name: string) =>
    apiClient.post<ApiResponse<DomainMaster>>('/admin/domains/masters', { name }),

  updateMaster: (masterId: number, name: string) =>
    apiClient.put<ApiResponse<DomainMaster>>(`/admin/domains/masters/${masterId}`, { name }),

  deleteMaster: (masterId: number) =>
    apiClient.delete<ApiResponse<void>>(`/admin/domains/masters/${masterId}`),

  // ── 슬레이브 CRUD ────────────────────────────────────────────────────────────

  createSlave: (masterId: number, name: string, displayOrder: number) =>
    apiClient.post<ApiResponse<DomainSlave>>(
      `/admin/domains/masters/${masterId}/slaves`,
      { name, displayOrder },
    ),

  updateSlave: (masterId: number, slaveId: number, name: string, displayOrder: number) =>
    apiClient.put<ApiResponse<DomainSlave>>(
      `/admin/domains/masters/${masterId}/slaves/${slaveId}`,
      { name, displayOrder },
    ),

  deleteSlave: (masterId: number, slaveId: number) =>
    apiClient.delete<ApiResponse<void>>(
      `/admin/domains/masters/${masterId}/slaves/${slaveId}`,
    ),
};
