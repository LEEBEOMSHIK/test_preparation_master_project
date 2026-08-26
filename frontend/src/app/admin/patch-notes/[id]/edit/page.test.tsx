import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ApiResponse, PatchNote, PatchNoteRequest } from '@/types';

type PatchNoteResponse = { data: ApiResponse<PatchNote> };
type AdminGetById = (id: number) => Promise<PatchNoteResponse>;
type AdminUpdate = (id: number, request: PatchNoteRequest) => Promise<PatchNoteResponse>;

const mockAdminGetById = jest.fn<AdminGetById>();
const mockAdminUpdate = jest.fn<AdminUpdate>();
const mockPush = jest.fn<(href: string) => void>();

jest.mock('next/navigation', () => ({
  __esModule: true,
  useParams: () => ({ id: '42' }),
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/services/patchNoteService', () => ({
  __esModule: true,
  patchNoteService: {
    adminGetById: mockAdminGetById,
    adminUpdate: mockAdminUpdate,
  },
}));

const EditPatchNotePage = require('./page').default as typeof import('./page').default;

const notFoundResponse: ApiResponse<PatchNote> = {
  success: false,
  error: {
    code: 'PATCH_NOTE_NOT_FOUND',
    message: '요청한 패치노트를 찾을 수 없습니다.',
  },
  timestamp: '2026-08-26T09:00:00Z',
};

describe('EditPatchNotePage', () => {
  beforeEach(() => {
    mockAdminGetById.mockReset();
    mockAdminUpdate.mockReset();
    mockPush.mockReset();
  });

  it('단건 조회 HTTP 오류의 백엔드 메시지를 표시한다', async () => {
    mockAdminGetById.mockRejectedValue({ response: { data: notFoundResponse } });

    render(<EditPatchNotePage />);

    expect((await screen.findByRole('alert')).textContent).toContain('요청한 패치노트를 찾을 수 없습니다.');
  });

  it('success=false 조회 응답의 애플리케이션 메시지를 표시한다', async () => {
    mockAdminGetById.mockResolvedValue({ data: notFoundResponse });

    render(<EditPatchNotePage />);

    expect((await screen.findByRole('alert')).textContent).toContain('요청한 패치노트를 찾을 수 없습니다.');
  });

  it('네트워크 조회 오류에는 친화적인 fallback을 표시한다', async () => {
    mockAdminGetById.mockRejectedValue(new Error('connection refused'));

    render(<EditPatchNotePage />);

    expect((await screen.findByRole('alert')).textContent).toContain(
      '패치노트를 불러오지 못했습니다. 다시 시도해 주세요.',
    );
  });
});
