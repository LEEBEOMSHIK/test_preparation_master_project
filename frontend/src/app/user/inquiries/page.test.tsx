import { beforeEach, describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { inquiryService } from '@/services/inquiryService';
import UserInquiriesPage from './page';

declare const jest: typeof import('@jest/globals').jest;

jest.mock('@/services/inquiryService', () => ({
  inquiryService: {
    getMyInquiries: jest.fn(),
  },
}));

function pageResult(page: number, size: number) {
  return {
    data: {
      success: true,
      data: {
        content: [{
          id: page + 1,
          title: `${page + 1}페이지 문의`,
          status: 'PENDING',
          requestType: 'BUG_REPORT',
          targetArea: 'EXAM_INFO',
          createdAt: '2026-08-28T10:00:00',
        }],
        totalElements: 21,
        totalPages: Math.ceil(21 / size),
        page,
        size,
      },
    },
  } as never;
}

describe('UserInquiriesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(inquiryService.getMyInquiries).mockImplementation(
      async (page = 0, size = 10) => pageResult(page, size),
    );
  });

  it('두 번째 페이지를 조회하고 영역은 제품 용어로 표시한다', async () => {
    render(<UserInquiriesPage />);

    expect(await screen.findByText('1페이지 문의')).toBeTruthy();
    expect(screen.getByText('시험정보')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));

    await waitFor(() => {
      expect(inquiryService.getMyInquiries).toHaveBeenLastCalledWith(1, 10, undefined);
    });
    expect(await screen.findByText('2페이지 문의')).toBeTruthy();
  });

  it('상태와 페이지 크기 변경 시 첫 페이지로 초기화한다', async () => {
    render(<UserInquiriesPage />);

    await screen.findByText('1페이지 문의');
    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));
    await waitFor(() => {
      expect(inquiryService.getMyInquiries).toHaveBeenLastCalledWith(1, 10, undefined);
    });

    fireEvent.click(screen.getByRole('button', { name: '접수' }));
    await waitFor(() => {
      expect(inquiryService.getMyInquiries).toHaveBeenLastCalledWith(0, 10, 'PENDING');
    });

    fireEvent.change(screen.getByLabelText('페이지당'), { target: { value: '20' } });
    await waitFor(() => {
      expect(inquiryService.getMyInquiries).toHaveBeenLastCalledWith(0, 20, 'PENDING');
    });
  });
});
