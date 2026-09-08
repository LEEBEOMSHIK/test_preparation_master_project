import { beforeEach, describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { bookmarkService } from '@/services/bookmarkService';
import type { BookmarkQuestion } from '@/types';
import BookmarksPage from './page';

declare const jest: typeof import('@jest/globals').jest;

const push = jest.fn();

jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
jest.mock('@/services/bookmarkService', () => ({
  bookmarkService: { getBookmarks: jest.fn(), toggle: jest.fn() },
}));
jest.mock('@/components/ui/QuestionDetailModal', () => ({ QuestionDetailModal: () => null }));

function response<T>(data: T) {
  return { data: { success: true, data } } as never;
}

function bookmark(id: number): BookmarkQuestion {
  return {
    bookmarkId: id,
    questionBankId: 100 + id,
    title: `북마크 ${id}`,
    content: `<p>문항 ${id}</p>`,
    questionType: 'MULTIPLE_CHOICE',
    bookmarkedAt: '2026-09-09T00:00:00',
  };
}

describe('BookmarksPage 페이지네이션', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(bookmarkService.getBookmarks).mockResolvedValue(response(Array.from({ length: 6 }, (_, index) => bookmark(index + 1))));
    jest.mocked(bookmarkService.toggle).mockResolvedValue(response({ bookmarked: false }));
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: jest.fn() });
  });

  it('북마크를 기본 다섯 개씩 표시하고 다음 페이지로 이동한다', async () => {
    render(<BookmarksPage />);

    expect(await screen.findByText('북마크 1')).toBeTruthy();
    expect(screen.getByText('북마크 5')).toBeTruthy();
    expect(screen.queryByText('북마크 6')).toBeNull();
    expect(screen.getByText('1-5 / 전체 6건')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));

    expect(screen.getByText('북마크 6')).toBeTruthy();
    expect(screen.queryByText('북마크 1')).toBeNull();
  });

  it('마지막 페이지의 유일한 북마크를 제거하면 유효한 첫 페이지로 복귀한다', async () => {
    render(<BookmarksPage />);
    await screen.findByText('북마크 1');
    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));

    fireEvent.click(screen.getByTitle('복습 표시 해제'));

    await waitFor(() => expect(screen.getByText('북마크 1')).toBeTruthy());
    expect(screen.getByText('1-5 / 전체 5건')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '다음 페이지' })).toBeNull();
  });

  it('조회 실패를 빈 목록으로 오인하지 않고 재시도해 목록을 복구한다', async () => {
    jest.mocked(bookmarkService.getBookmarks)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(response([bookmark(1)]));

    render(<BookmarksPage />);

    expect(await screen.findByText('복습 표시를 불러오지 못했습니다.')).toBeTruthy();
    expect(screen.queryByText('복습 표시한 문항이 없습니다')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByText('북마크 1')).toBeTruthy();
  });

  it('StrictMode에서 늦게 끝난 이전 조회가 최신 북마크를 덮어쓰지 않는다', async () => {
    type BookmarkResponse = Awaited<ReturnType<typeof bookmarkService.getBookmarks>>;
    let resolveOldRequest: ((value: BookmarkResponse) => void) | undefined;
    const oldRequest = new Promise<BookmarkResponse>(resolve => {
      resolveOldRequest = resolve;
    });
    jest.mocked(bookmarkService.getBookmarks)
      .mockReturnValueOnce(oldRequest)
      .mockResolvedValueOnce(response([bookmark(2)]));

    render(<StrictMode><BookmarksPage /></StrictMode>);

    expect(await screen.findByText('북마크 2')).toBeTruthy();
    resolveOldRequest?.(response([bookmark(1)]));

    await waitFor(() => expect(screen.queryByText('북마크 1')).toBeNull());
    expect(screen.getByText('북마크 2')).toBeTruthy();
  });
});
