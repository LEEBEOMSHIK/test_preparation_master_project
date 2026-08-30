import { describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { inquiryService } from '@/services/inquiryService';
import AdminInquiriesPage from './page';

declare const jest: typeof import('@jest/globals').jest;

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/services/inquiryService', () => ({
  inquiryService: {
    adminGetAll: jest.fn(),
    adminDelete: jest.fn(),
  },
}));

describe('AdminInquiriesPage', () => {
  it('서버에 페이지와 모든 검색 필터를 전달하고 전체 조회 크기를 사용하지 않는다', async () => {
    jest.mocked(inquiryService.adminGetAll).mockResolvedValue({
      data: {
        success: true,
        data: { content: [], totalElements: 0, totalPages: 0, page: 0, size: 10 },
      },
    } as never);

    render(<AdminInquiriesPage />);

    await waitFor(() => {
      expect(inquiryService.adminGetAll).toHaveBeenCalledWith(0, 10, {});
    });
    fireEvent.change(screen.getByLabelText('상태'), { target: { value: 'IN_PROGRESS' } });
    fireEvent.change(screen.getByLabelText('접수 유형'), { target: { value: 'BUG_REPORT' } });
    fireEvent.change(screen.getByLabelText('발생 영역'), { target: { value: 'EXAM_INFO' } });
    fireEvent.change(screen.getByLabelText('제목 / 작성자'), { target: { value: '로그인' } });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(inquiryService.adminGetAll).toHaveBeenLastCalledWith(0, 10, {
        status: 'IN_PROGRESS',
        requestType: 'BUG_REPORT',
        targetArea: 'EXAM_INFO',
        keyword: '로그인',
      });
    });
    expect(inquiryService.adminGetAll).not.toHaveBeenCalledWith(0, 10_000, expect.anything());
  });
});
