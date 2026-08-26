import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ApiResponse, PageResponse, PatchNote } from '@/types';

type PatchNotePageResponse = { data: ApiResponse<PageResponse<PatchNote>> };
type DeleteResponse = { data: ApiResponse<void> };
type AdminGetAll = (page?: number, size?: number) => Promise<PatchNotePageResponse>;
type AdminDelete = (id: number) => Promise<DeleteResponse>;

const mockAdminGetAll = jest.fn<AdminGetAll>();
const mockAdminDelete = jest.fn<AdminDelete>();

jest.mock('@/services/patchNoteService', () => ({
  __esModule: true,
  patchNoteService: {
    adminGetAll: mockAdminGetAll,
    adminDelete: mockAdminDelete,
    adminUpdatePublication: jest.fn(),
  },
}));

jest.mock('@/components/ui/Skeleton', () => ({
  __esModule: true,
  TableSkeleton: () => <div role="progressbar" aria-label="패치노트 관리 목록 불러오는 중" />,
}));

const AdminPatchNotesPage = require('./page').default as typeof import('./page').default;

function patchNote(id: number, title: string): PatchNote {
  return {
    id,
    title,
    version: `v${id}`,
    content: `<p>${title} 본문</p>`,
    published: true,
    publishedAt: '2026-08-26T09:00:00',
    createdAt: '2026-08-26T09:00:00',
    updatedAt: '2026-08-26T09:00:00',
  };
}

function pageResponse(page: number, content: PatchNote[], totalPages: number): PatchNotePageResponse {
  return {
    data: {
      success: true,
      timestamp: '2026-08-26T09:00:00',
      data: {
        content,
        totalElements: totalPages > 1 ? 11 : content.length,
        totalPages,
        page,
        size: 10,
      },
    },
  };
}

const deleteResponse: DeleteResponse = {
  data: { success: true, timestamp: '2026-08-26T09:00:00' },
};

describe('AdminPatchNotesPage', () => {
  beforeEach(() => {
    mockAdminGetAll.mockReset();
    mockAdminDelete.mockReset();
    jest.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('마지막 페이지의 유일한 항목을 삭제하면 이전 페이지로 이동해 재조회한다', async () => {
    mockAdminGetAll
      .mockResolvedValueOnce(pageResponse(0, [patchNote(1, '첫 페이지 패치노트')], 2))
      .mockResolvedValueOnce(pageResponse(1, [patchNote(11, '마지막 패치노트')], 2))
      .mockResolvedValueOnce(pageResponse(0, [patchNote(1, '첫 페이지 패치노트')], 1));
    mockAdminDelete.mockResolvedValue(deleteResponse);

    render(<AdminPatchNotesPage />);

    expect(await screen.findByText('첫 페이지 패치노트')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));
    expect(await screen.findByText('마지막 패치노트')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));

    await waitFor(() => expect(mockAdminGetAll).toHaveBeenLastCalledWith(0, 10));
    expect(mockAdminDelete).toHaveBeenCalledWith(11);
  });

  it('첫 페이지의 유일한 항목을 삭제하면 첫 페이지를 재조회한다', async () => {
    mockAdminGetAll
      .mockResolvedValueOnce(pageResponse(0, [patchNote(1, '유일한 패치노트')], 1))
      .mockResolvedValueOnce(pageResponse(0, [], 0));
    mockAdminDelete.mockResolvedValue(deleteResponse);

    render(<AdminPatchNotesPage />);

    expect(await screen.findByText('유일한 패치노트')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));

    await waitFor(() => expect(mockAdminGetAll).toHaveBeenCalledTimes(2));
    expect(mockAdminGetAll).toHaveBeenLastCalledWith(0, 10);
  });

  it('첫 페이지가 아니어도 여러 항목이 있으면 현재 페이지를 재조회한다', async () => {
    mockAdminGetAll
      .mockResolvedValueOnce(pageResponse(0, [patchNote(1, '첫 페이지 패치노트')], 2))
      .mockResolvedValueOnce(pageResponse(1, [patchNote(11, '삭제 대상'), patchNote(12, '남은 패치노트')], 2))
      .mockResolvedValueOnce(pageResponse(1, [patchNote(12, '남은 패치노트')], 2));
    mockAdminDelete.mockResolvedValue(deleteResponse);

    render(<AdminPatchNotesPage />);

    expect(await screen.findByText('첫 페이지 패치노트')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));
    expect(await screen.findByText('삭제 대상')).not.toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: '삭제' })[0]);

    await waitFor(() => expect(mockAdminGetAll).toHaveBeenCalledTimes(3));
    expect(mockAdminGetAll).toHaveBeenLastCalledWith(1, 10);
  });
});
