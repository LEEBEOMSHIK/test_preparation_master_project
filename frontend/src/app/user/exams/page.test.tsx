import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from '@jest/globals';
import UserExamsPage from './page';

declare const jest: typeof import('@jest/globals').jest;

const mockGetExaminations = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockGetFilters = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockGetExamTypes = jest.fn<(...args: unknown[]) => Promise<unknown>>();
let mockInterestedExamTypes = ['정보처리기사'];

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/services/examinationService', () => ({
  examinationService: {
    userGetExaminations: (...args: unknown[]) => mockGetExaminations(...args),
    userGetExaminationFilters: (...args: unknown[]) => mockGetFilters(...args),
  },
}));
jest.mock('@/services/examInfoService', () => ({
  examInfoService: {
    getExamTypes: (...args: unknown[]) => mockGetExamTypes(...args),
  },
}));
jest.mock('@/services/quoteService', () => ({
  quoteService: { getRandom: () => Promise.resolve({ data: { success: true, data: null } }) },
}));
jest.mock('@/store/authStore', () => ({
  useAuthStore: () => ({ user: { interestedExamTypes: mockInterestedExamTypes } }),
}));

const exam = (id: number, title: string) => ({
  id,
  title,
  examPaperId: 10,
  examPaperTitle: '시험지',
  categoryId: 1,
  categoryName: '정보처리기사',
  timeLimit: 60,
  examYear: 2025,
  examRound: 1,
  isAiCustom: false,
  useYn: 'Y',
  createdAt: '2026-09-09T10:00:00',
});

const pageResponse = (content: ReturnType<typeof exam>[], page: number, totalElements: number) => ({
  data: {
    success: true,
    data: {
      content,
      page,
      size: 5,
      totalElements,
      totalPages: Math.ceil(totalElements / 5),
    },
  },
});

describe('사용자 시험 서버 목록', () => {
  beforeEach(() => {
    mockGetExaminations.mockReset();
    mockGetFilters.mockReset();
    mockGetExamTypes.mockReset();
    mockInterestedExamTypes = ['정보처리기사'];
    mockGetExamTypes.mockResolvedValue({
      data: { success: true, data: [{ id: 1, name: '정보처리기사' }, { id: 2, name: 'SQLD' }] },
    });
    mockGetFilters.mockResolvedValue({
      data: { success: true, data: { years: [2025, 2024], rounds: [3, 2, 1] } },
    });
    window.localStorage.clear();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: jest.fn(),
    });
  });

  it('기본 5개 서버 페이지를 이동하고 전체 활성 시험의 연도·회차 선택지를 유지한다', async () => {
    mockGetExaminations.mockImplementation(async page =>
      pageResponse([exam(Number(page) + 1, `서버 페이지 ${page}`)], Number(page), 6));

    render(<UserExamsPage />);

    await screen.findByText('서버 페이지 0');
    expect(mockGetExaminations).toHaveBeenCalledWith(0, 5, {
      interests: ['정보처리기사'],
    });
    expect(mockGetFilters).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('option', { name: '2024년' })).not.toBeNull();
    expect(screen.getByRole('option', { name: '3회' })).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));

    await screen.findByText('서버 페이지 1');
    expect(mockGetExaminations).toHaveBeenLastCalledWith(1, 5, {
      interests: ['정보처리기사'],
    });
  });

  it('검색 조건과 페이지 크기를 바꾸면 첫 페이지부터 서버 조회한다', async () => {
    mockGetExaminations.mockImplementation(async (page, size) => ({
      ...pageResponse([exam(Number(page) + 1, `조회 ${page}-${size}`)], Number(page), 12),
      data: {
        ...pageResponse([], 0, 0).data,
        success: true,
        data: {
          content: [exam(Number(page) + 1, `조회 ${page}-${size}`)],
          page: Number(page),
          size: Number(size),
          totalElements: 12,
          totalPages: Math.ceil(12 / Number(size)),
        },
      },
    }));
    render(<UserExamsPage />);
    await screen.findByText('조회 0-5');
    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));
    await screen.findByText('조회 1-5');

    fireEvent.change(screen.getByPlaceholderText('시험 제목 검색...'), {
      target: { value: '  실전  ' },
    });

    await waitFor(() => expect(mockGetExaminations).toHaveBeenLastCalledWith(0, 5, {
      title: '실전',
      interests: ['정보처리기사'],
    }));

    fireEvent.change(screen.getByRole('combobox', { name: '페이지당 항목 수' }), {
      target: { value: '10' },
    });
    await waitFor(() => expect(mockGetExaminations).toHaveBeenLastCalledWith(0, 10, {
      title: '실전',
      interests: ['정보처리기사'],
    }));
  });

  it('늦게 도착한 이전 검색 응답으로 최신 목록을 덮어쓰지 않는다', async () => {
    let resolveOld: ((value: unknown) => void) | undefined;
    mockGetExaminations.mockImplementation((page, size, filters) => {
      const title = (filters as { title?: string } | undefined)?.title;
      if (title === '새') return Promise.resolve(pageResponse([exam(2, '새 결과')], 0, 1));
      return new Promise(resolve => { resolveOld = resolve; });
    });
    render(<UserExamsPage />);

    fireEvent.change(screen.getByPlaceholderText('시험 제목 검색...'), {
      target: { value: '새' },
    });
    await screen.findByText('새 결과');
    await act(async () => { resolveOld?.(pageResponse([exam(1, '오래된 결과')], 0, 1)); });

    expect(screen.queryByText('오래된 결과')).toBeNull();
    expect(screen.getByText('새 결과')).not.toBeNull();
  });

  it('조회 실패를 표시하고 같은 조건으로 재시도한다', async () => {
    mockGetExaminations
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue(pageResponse([exam(1, '복구된 시험')], 0, 1));
    render(<UserExamsPage />);

    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    await screen.findByText('복구된 시험');
    expect(mockGetExaminations).toHaveBeenLastCalledWith(0, 5, {
      interests: ['정보처리기사'],
    });
  });

  it('필터 메타데이터 조회 실패를 목록과 분리해 표시하고 재시도한다', async () => {
    mockGetFilters
      .mockRejectedValueOnce(new Error('metadata network'))
      .mockResolvedValue({
        data: { success: true, data: { years: [2025, 2024], rounds: [3, 2, 1] } },
      });
    mockGetExaminations.mockResolvedValue(pageResponse([exam(1, '목록은 유지')], 0, 1));
    render(<UserExamsPage />);

    await screen.findByText('목록은 유지');
    await screen.findByText('필터 정보를 불러오지 못했습니다.');
    expect(mockGetExaminations).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: '필터 다시 시도' }));

    expect(await screen.findByRole('option', { name: '2024년' })).not.toBeNull();
    await waitFor(() => expect(screen.queryByText('필터 정보를 불러오지 못했습니다.')).toBeNull());
    expect(mockGetExaminations).toHaveBeenCalledTimes(1);
  });

  it('시험유형 메타데이터 success=false도 오류로 처리하고 재시도한다', async () => {
    mockGetExamTypes
      .mockResolvedValueOnce({ data: { success: false, error: { message: '유형 실패' } } })
      .mockResolvedValue({
        data: { success: true, data: [{ id: 1, name: '정보처리기사' }, { id: 2, name: 'SQLD' }] },
      });
    mockGetExaminations.mockResolvedValue(pageResponse([exam(1, '목록은 정상')], 0, 1));
    render(<UserExamsPage />);

    await screen.findByText('유형 실패');
    fireEvent.click(screen.getByRole('button', { name: '필터 다시 시도' }));

    expect(await screen.findByRole('option', { name: '정보처리기사' })).not.toBeNull();
  });

  it('로그인 사용자의 관심유형이 바뀌면 현재 페이지 대신 첫 페이지를 조회한다', async () => {
    mockGetExaminations.mockImplementation(async (page, size, filters) =>
      pageResponse([
        exam(Number(page) + 1, `${(filters as { interests?: string[] }).interests?.[0]} ${page}`),
      ], Number(page), 20));
    const { rerender } = render(<UserExamsPage />);
    await screen.findByText('정보처리기사 0');
    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));
    await screen.findByText('정보처리기사 1');

    mockInterestedExamTypes = ['SQLD'];
    rerender(<UserExamsPage />);

    await screen.findByText('SQLD 0');
    expect(mockGetExaminations).toHaveBeenLastCalledWith(0, 5, { interests: ['SQLD'] });
  });

  it('서버가 빈 전체 페이지를 반환하면 0페이지로 보정해 다시 조회한다', async () => {
    let firstPageRequests = 0;
    mockGetExaminations.mockImplementation(async page => {
      if (page === 1) return pageResponse([], 1, 0);
      firstPageRequests += 1;
      return firstPageRequests === 1
        ? pageResponse([exam(1, '첫 조회')], 0, 6)
        : pageResponse([], 0, 0);
    });
    render(<UserExamsPage />);
    await screen.findByText('첫 조회');

    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));

    await waitFor(() => expect(mockGetExaminations).toHaveBeenLastCalledWith(0, 5, {
      interests: ['정보처리기사'],
    }));
    expect(mockGetExaminations).toHaveBeenCalledTimes(3);
  });
});
