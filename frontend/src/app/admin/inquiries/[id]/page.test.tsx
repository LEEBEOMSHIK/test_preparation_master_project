import { beforeEach, describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { inquiryService } from '@/services/inquiryService';
import type { InquiryDetail } from '@/types';
import AdminInquiryDetailPage from './page';

declare const jest: typeof import('@jest/globals').jest;

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '42' }),
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/services/inquiryService', () => ({
  inquiryService: {
    adminGetOne: jest.fn(),
    adminUpdateStatus: jest.fn(),
    adminDelete: jest.fn(),
    adminAddMessage: jest.fn(),
    uploadMessageImage: jest.fn(),
    getEmailDeliveries: jest.fn(),
    retryEmailDelivery: jest.fn(),
  },
}));

const baseInquiry: InquiryDetail = {
  id: 42,
  title: '관리자 테스트 문의',
  content: '최초 문의 내용',
  requestType: 'GENERAL_INQUIRY',
  status: 'IN_PROGRESS',
  imageUrls: [],
  messages: [],
  createdAt: '2026-08-28T10:00:00',
  userId: 7,
  userName: '문의자',
};

function apiSuccess<T>(data: T) {
  return { data: { success: true, data } } as never;
}

describe('AdminInquiryDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(inquiryService.adminGetOne).mockResolvedValue(apiSuccess(baseInquiry));
    jest.mocked(inquiryService.getEmailDeliveries).mockResolvedValue(apiSuccess({
      content: [],
      totalElements: 0,
      totalPages: 0,
      page: 0,
      size: 20,
    }));
  });

  it('일반 문의에는 ANSWERED만 종료 옵션으로 표시한다', async () => {
    render(<AdminInquiryDetailPage />);

    const statusSelect = await screen.findByLabelText('변경할 상태');
    expect(statusSelect.textContent).toContain('답변 완료');
    expect(statusSelect.textContent).not.toContain('처리 완료');
    expect(statusSelect.textContent).not.toContain('처리 불가');
  });

  it('처리형 요청에는 COMPLETED와 UNABLE_TO_PROCESS만 종료 옵션으로 표시한다', async () => {
    jest.mocked(inquiryService.adminGetOne).mockResolvedValue(apiSuccess({
      ...baseInquiry,
      requestType: 'BUG_REPORT',
    }));

    render(<AdminInquiryDetailPage />);

    const statusSelect = await screen.findByLabelText('변경할 상태');
    expect(statusSelect.textContent).not.toContain('답변 완료');
    expect(statusSelect.textContent).toContain('처리 완료');
    expect(statusSelect.textContent).toContain('처리 불가');
  });

  it('종료 설명을 필수로 하고 이메일은 기본 false이며 성공 후 false로 초기화한다', async () => {
    jest.mocked(inquiryService.adminUpdateStatus)
      .mockResolvedValueOnce(apiSuccess({ ...baseInquiry, status: 'ANSWERED' }))
      .mockResolvedValueOnce(apiSuccess({ ...baseInquiry, status: 'IN_PROGRESS' }));

    render(<AdminInquiryDetailPage />);

    const statusSelect = await screen.findByLabelText('변경할 상태');
    fireEvent.change(statusSelect, { target: { value: 'ANSWERED' } });
    fireEvent.click(screen.getByRole('button', { name: '상태 변경' }));
    expect(await screen.findByText('종료 안내 내용을 입력해 주세요.')).toBeTruthy();
    expect(inquiryService.adminUpdateStatus).not.toHaveBeenCalled();

    const statusRegion = screen.getByRole('region', { name: '상태 변경' });
    const emailCheckbox = within(statusRegion).getByLabelText('사용자에게 이메일 알림 발송') as HTMLInputElement;
    expect(emailCheckbox.checked).toBe(false);
    fireEvent.click(emailCheckbox);
    expect(emailCheckbox.checked).toBe(true);
    fireEvent.change(screen.getByLabelText('종료 안내'), { target: { value: '답변을 완료했습니다.' } });
    fireEvent.click(screen.getByRole('button', { name: '상태 변경' }));

    await waitFor(() => {
      expect(inquiryService.adminUpdateStatus).toHaveBeenCalledWith(
        42,
        'ANSWERED',
        '답변을 완료했습니다.',
        true,
      );
    });
    fireEvent.click(await screen.findByRole('button', { name: '다시 열기' }));
    await waitFor(() => {
      expect(inquiryService.adminUpdateStatus).toHaveBeenCalledWith(42, 'IN_PROGRESS', '', false);
    });
    const resetStatusSelect = await screen.findByLabelText('변경할 상태');
    fireEvent.change(resetStatusSelect, { target: { value: 'ANSWERED' } });
    const resetStatusRegion = screen.getByRole('region', { name: '상태 변경' });
    expect((within(resetStatusRegion).getByLabelText('사용자에게 이메일 알림 발송') as HTMLInputElement).checked).toBe(false);
  });

  it('FAILED 이메일의 오류를 표시하고 재발송 API를 호출한다', async () => {
    jest.mocked(inquiryService.getEmailDeliveries).mockResolvedValue(apiSuccess({
      content: [{
        id: 91,
        inquiryId: 42,
        inquiryMessageId: 3,
        eventType: 'ADMIN_MESSAGE',
        status: 'FAILED',
        recipientEmail: 'user@example.com',
        subject: '답변 안내',
        attemptCount: 1,
        lastError: 'SMTP 연결 실패',
        createdAt: '2026-08-28T12:00:00',
        sentAt: null,
      }],
      totalElements: 1,
      totalPages: 1,
      page: 0,
      size: 20,
    }));
    jest.mocked(inquiryService.retryEmailDelivery).mockResolvedValue(apiSuccess(null));

    render(<AdminInquiryDetailPage />);

    expect(await screen.findByText('SMTP 연결 실패')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '재발송' }));

    await waitFor(() => {
      expect(inquiryService.retryEmailDelivery).toHaveBeenCalledWith(91);
    });
  });

  it('이메일 이력의 다음 페이지, 실패 필터, 새로고침을 현재 조건으로 조회한다', async () => {
    jest.mocked(inquiryService.getEmailDeliveries).mockImplementation(
      async (_inquiryId, page = 0, size = 20, status) => apiSuccess({
        content: [{
          id: page + 1,
          inquiryId: 42,
          inquiryMessageId: null,
          eventType: 'NEW_INQUIRY',
          status: status ?? 'SENT',
          recipientEmail: 'admin@example.com',
          subject: `${page + 1}페이지 이력`,
          attemptCount: 1,
          lastError: null,
          createdAt: '2026-08-28T12:00:00',
          sentAt: '2026-08-28T12:00:01',
        }],
        totalElements: 21,
        totalPages: 2,
        page,
        size,
      }),
    );

    render(<AdminInquiryDetailPage />);

    expect(await screen.findByText('1페이지 이력')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));
    await waitFor(() => {
      expect(inquiryService.getEmailDeliveries).toHaveBeenLastCalledWith(42, 1, 20, undefined);
    });

    fireEvent.change(screen.getByLabelText('발송 상태'), { target: { value: 'FAILED' } });
    await waitFor(() => {
      expect(inquiryService.getEmailDeliveries).toHaveBeenLastCalledWith(42, 0, 20, 'FAILED');
    });

    const callCountBeforeRefresh = jest.mocked(inquiryService.getEmailDeliveries).mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: '발송 이력 새로고침' }));
    await waitFor(() => {
      expect(inquiryService.getEmailDeliveries).toHaveBeenCalledTimes(callCountBeforeRefresh + 1);
    });
    expect(inquiryService.getEmailDeliveries).toHaveBeenLastCalledWith(42, 0, 20, 'FAILED');
  });
});
