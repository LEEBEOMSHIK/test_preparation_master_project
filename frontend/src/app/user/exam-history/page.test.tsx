import { beforeEach, describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { examinationService } from '@/services/examinationService';
import ExamHistoryPage from './page';

declare const jest: typeof import('@jest/globals').jest;

const push = jest.fn();

jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
jest.mock('@/services/examinationService', () => ({
  examinationService: { userGetExamHistories: jest.fn() },
}));

function pageResponse(page: number) {
  return {
    data: {
      success: true,
      data: {
        content: [{
          id: page + 1,
          examinationTitle: `${page + 1}페이지 시험`,
          totalQuestions: 10,
          correctCount: 8,
          score: 80,
          takenAt: '2026-09-09T10:00:00',
        }],
        totalElements: 21,
        totalPages: 3,
        page,
        size: 10,
      },
    },
  } as never;
}

describe('ExamHistoryPage 페이지네이션', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(examinationService.userGetExamHistories).mockImplementation(async (page = 0) => pageResponse(page));
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: jest.fn() });
  });

  it('기존 10개 조회 계약을 유지하며 공용 페이지 표시로 다음 이력을 조회한다', async () => {
    render(<ExamHistoryPage />);

    expect(await screen.findByText('1페이지 시험')).toBeTruthy();
    expect(screen.getByText('1-10 / 전체 21건')).toBeTruthy();
    expect(screen.queryByRole('combobox', { name: '페이지당 항목 수' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));

    await waitFor(() => expect(examinationService.userGetExamHistories).toHaveBeenLastCalledWith(1, 10));
    expect(await screen.findByText('2페이지 시험')).toBeTruthy();
  });

  it('조회 실패를 빈 이력으로 표시하지 않고 같은 페이지를 재시도한다', async () => {
    jest.mocked(examinationService.userGetExamHistories)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(pageResponse(0));

    render(<ExamHistoryPage />);

    expect(await screen.findByText('시험 이력을 불러오지 못했습니다.')).toBeTruthy();
    expect(screen.queryByText('아직 응시한 시험이 없습니다.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    await waitFor(() => expect(examinationService.userGetExamHistories).toHaveBeenLastCalledWith(0, 10));
    expect(await screen.findByText('1페이지 시험')).toBeTruthy();
  });
});
