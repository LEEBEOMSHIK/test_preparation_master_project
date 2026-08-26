import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ApiResponse, PageResponse, PatchNote } from '@/types';

type PublishedPageResponse = { data: ApiResponse<PageResponse<PatchNote>> };
type GetPublished = (page?: number, size?: number) => Promise<PublishedPageResponse>;

const mockGetPublished = jest.fn<GetPublished>();

jest.mock('@/services/patchNoteService', () => ({
  __esModule: true,
  patchNoteService: {
    getPublished: mockGetPublished,
  },
}));

jest.mock('@/components/ui/RichContent', () => ({
  __esModule: true,
  RichContent: ({ html }: { html: string }) => <div data-testid="rich-content">{html}</div>,
}));

jest.mock('@/components/ui/Skeleton', () => ({
  __esModule: true,
  CardListSkeleton: () => <div role="progressbar" aria-label="패치노트 목록 불러오는 중" />,
}));

const PatchNotesPage = require('./page').default as typeof import('./page').default;

function pageResponse(page: number, publishedAt: string | null = '2026-08-26T09:00:00'): PublishedPageResponse {
  return {
    data: {
      success: true,
      timestamp: '2026-08-26T09:00:00',
      data: {
        content: [{
          id: page + 1,
          version: `v1.${page}`,
          title: `패치노트 ${page + 1}`,
          content: `<p>본문 ${page + 1}</p>`,
          published: true,
          publishedAt,
          createdAt: '2026-08-26T09:00:00',
          updatedAt: '2026-08-26T09:00:00',
        }],
        totalElements: 2,
        totalPages: 2,
        page,
        size: 10,
      },
    },
  };
}

describe('PatchNotesPage', () => {
  beforeEach(() => {
    mockGetPublished.mockReset();
  });

  it('목록을 0 기반 페이지로 조회하고 페이지 전환 시 다음 API 페이지를 요청한다', async () => {
    mockGetPublished
      .mockResolvedValueOnce(pageResponse(0))
      .mockResolvedValueOnce(pageResponse(1));

    render(<PatchNotesPage />);

    expect(screen.getByRole('progressbar', { name: '패치노트 목록 불러오는 중' })).not.toBeNull();
    expect(await screen.findByText('패치노트 1')).not.toBeNull();
    expect(screen.getByText('v1.0')).not.toBeNull();
    expect(screen.getByTestId('rich-content').textContent).toContain('본문 1');
    expect(mockGetPublished).toHaveBeenLastCalledWith(0, 10);

    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));

    await waitFor(() => {
      expect(mockGetPublished).toHaveBeenLastCalledWith(1, 10);
    });
    expect(await screen.findByText('패치노트 2')).not.toBeNull();
  });

  it('조회 실패를 재시도할 수 있고 게시일이 없으면 안전한 안내를 표시한다', async () => {
    mockGetPublished
      .mockRejectedValueOnce(new Error('network failed'))
      .mockResolvedValueOnce(pageResponse(0, null));

    render(<PatchNotesPage />);

    expect(await screen.findByRole('alert')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByText('게시일 정보 없음')).not.toBeNull();
    expect(mockGetPublished).toHaveBeenCalledTimes(2);
  });
});
