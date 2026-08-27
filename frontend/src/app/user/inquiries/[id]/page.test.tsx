import { beforeEach, describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { useParams } from 'next/navigation';
import { inquiryService } from '@/services/inquiryService';
import InquiryDetailPage from './page';

declare const jest: typeof import('@jest/globals').jest;

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

jest.mock('@/services/inquiryService', () => ({
  inquiryService: {
    getMyInquiry: jest.fn(),
    addMessage: jest.fn(),
    uploadMessageImage: jest.fn(),
  },
}));

describe('InquiryDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useParams).mockReturnValue({ id: '31' });
  });

  it('종료 상태 문의에는 추가 메시지 작성기를 표시하지 않는다', async () => {
    jest.mocked(inquiryService.getMyInquiry).mockResolvedValue({
      data: {
        success: true,
        data: {
          id: 31,
          title: '종료된 일반 문의',
          content: '문의 본문',
          status: 'ANSWERED',
          requestType: 'GENERAL_INQUIRY',
          targetArea: 'USER_HOME',
          detailLocation: '/user',
          createdAt: '2026-08-28T10:00:00',
          imageUrls: [],
          messages: [
            {
              id: 41,
              authorId: 1,
              authorRole: 'ADMIN',
              content: '답변을 완료했습니다.',
              createdAt: '2026-08-28T11:00:00',
              imageUrls: [],
            },
          ],
        },
      },
    } as never);

    render(<InquiryDetailPage />);

    expect(await screen.findByText('종료된 일반 문의')).toBeTruthy();
    expect(screen.getByText('처리가 종료되었습니다.')).toBeTruthy();
    expect(screen.queryByPlaceholderText('추가 내용을 입력해 주세요.')).toBeNull();
    expect(inquiryService.getMyInquiry).toHaveBeenCalledWith(31);
  });
});
