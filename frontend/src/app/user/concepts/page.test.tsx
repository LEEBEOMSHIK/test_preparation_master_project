import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from '@jest/globals';
import Page from './page';
import ExplorePage from './explore/page';
import type { ConceptNote, PageResponse } from '@/types';
declare const jest: typeof import('@jest/globals').jest;
const mockGet = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockDelete = jest.fn<(...args: unknown[]) => Promise<unknown>>();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/services/conceptNoteService', () => ({ conceptNoteService: { getMyNotes: (...args: unknown[]) => mockGet(...args), getPublicNotes: (...args: unknown[]) => mockGet(...args), delete: (...args: unknown[]) => mockDelete(...args) } }));
jest.mock('@/services/notionService', () => ({ notionService: { getStatus: () => Promise.resolve({ data: { data: null } }) } }));
const note = (id: number, title: string): ConceptNote => ({ id, title, content: '', isPublic: true, createdAt: '2026-09-09', updatedAt: '2026-09-09', userName: '작성자' });
const response = (content: ConceptNote[], total = 6) => ({ data: { success: true, data: { content, totalElements: total, totalPages: Math.ceil(total / 5), page: 0, size: 5 } satisfies PageResponse<ConceptNote> } });
const listPages = [{ name: '내 노트', Component: Page }, { name: '공개 노트', Component: ExplorePage }];
describe('개념노트 서버 목록', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockDelete.mockReset();
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    Element.prototype.scrollIntoView = jest.fn();
  });
  it('첫 페이지 밖 제목을 서버 검색하고 검색 결과의 다음 페이지를 유지한다', async () => {
    mockGet.mockImplementation(async (page, size, keyword) => response([note(1, keyword ? `찾은 제목 ${page}` : '기존 제목')]));
    render(<Page />);
    await screen.findByText('기존 제목');
    expect(mockGet).toHaveBeenCalledWith(0, 5, undefined);
    fireEvent.change(screen.getByPlaceholderText('제목 검색'), { target: { value: '찾은' } });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));
    await screen.findByText('찾은 제목 0');
    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));
    await screen.findByText('찾은 제목 1');
    expect(mockGet).toHaveBeenLastCalledWith(1, 5, '찾은');
  });
  it('마지막 페이지 항목 삭제 후 서버 건수에 따라 이전 페이지로 돌아간다', async () => {
    let deleted = false;
    mockGet.mockImplementation(async (page) => response(page === 1 ? (deleted ? [] : [note(6, '마지막')]) : [note(1, '첫 노트')], deleted ? 5 : 6));
    mockDelete.mockImplementation(async () => { deleted = true; });
    render(<Page />);
    await screen.findByText('첫 노트');
    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));
    await screen.findByText('마지막');
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    await screen.findByText('첫 노트');
    expect(mockGet).toHaveBeenLastCalledWith(0, 5, undefined);
  });
  it.each(listPages)('$name 늦은 이전 검색 응답을 무시한다', async ({ Component }) => {
    let resolveOld: ((value: unknown) => void) | undefined;
    mockGet.mockImplementation((page, size, keyword) => keyword ? Promise.resolve(response([note(2, '새 결과')], 1)) : new Promise(resolve => { resolveOld = resolve; }));
    render(<Component />);
    fireEvent.change(screen.getByPlaceholderText('제목 검색'), { target: { value: '새' } });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));
    await screen.findByText('새 결과');
    await act(async () => { resolveOld?.(response([note(1, '오래된 결과')])); });
    expect(screen.queryByText('오래된 결과')).toBeNull();
  });
  it.each(listPages)('$name 조회 실패를 표시하고 재시도한다', async ({ Component }) => {
    mockGet.mockRejectedValueOnce(new Error('network')).mockResolvedValue(response([note(1, '복구 결과')], 1));
    render(<Component />);
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    await screen.findByText('복구 결과');
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
});
