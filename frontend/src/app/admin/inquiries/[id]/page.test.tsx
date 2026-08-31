import { beforeEach, describe, expect, it } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { emailTemplateService } from '@/services/emailTemplateService';
import { inquiryService } from '@/services/inquiryService';
import type { EmailTemplateBinding, InquiryDetail } from '@/types';
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

jest.mock('@/services/emailTemplateService', () => ({
  emailTemplateService: {
    getBindings: jest.fn(),
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

const sendableBindings: EmailTemplateBinding[] = [
  {
    eventCode: 'INQUIRY_ANSWERED',
    eventLabel: '답변 완료',
    scope: 'INQUIRY_STATUS',
    templateId: 1,
    templateName: '답변 완료 안내',
    templateActive: true,
    configured: true,
    sendable: true,
    unavailableReason: null,
  },
  {
    eventCode: 'INQUIRY_COMPLETED',
    eventLabel: '처리 완료',
    scope: 'INQUIRY_STATUS',
    templateId: 2,
    templateName: '처리 완료 안내',
    templateActive: true,
    configured: true,
    sendable: true,
    unavailableReason: null,
  },
  {
    eventCode: 'INQUIRY_UNABLE_TO_PROCESS',
    eventLabel: '처리 불가',
    scope: 'INQUIRY_STATUS',
    templateId: 3,
    templateName: '처리 불가 안내',
    templateActive: true,
    configured: true,
    sendable: true,
    unavailableReason: null,
  },
];

function apiSuccess<T>(data: T) {
  return { data: { success: true, data } } as never;
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe('AdminInquiryDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(inquiryService.adminGetOne).mockResolvedValue(apiSuccess(baseInquiry));
    jest.mocked(emailTemplateService.getBindings).mockResolvedValue(apiSuccess(sendableBindings));
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

    const statusSelect = await screen.findByLabelText('처리 상태');
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

    const statusSelect = await screen.findByLabelText('처리 상태');
    expect(statusSelect.textContent).not.toContain('답변 완료');
    expect(statusSelect.textContent).toContain('처리 완료');
    expect(statusSelect.textContent).toContain('처리 불가');
  });

  it('답변 영역은 타임라인 등록임을 설명하고 상태 영역에는 종료 안내 입력이 없다', async () => {
    render(<AdminInquiryDetailPage />);

    expect(await screen.findByRole('heading', { name: '사용자에게 답변' })).toBeTruthy();
    expect(screen.getByText(/문의 타임라인에 관리자 답변으로 추가/)).toBeTruthy();
    expect(screen.queryByLabelText('종료 안내')).toBeNull();
  });

  it('관리자 답변 없이 종료하면 확인 모달 뒤에만 상태 API를 호출한다', async () => {
    const completedInquiry = { ...baseInquiry, requestType: 'BUG_REPORT' as const, status: 'COMPLETED' as const };
    jest.mocked(inquiryService.adminGetOne).mockResolvedValue(apiSuccess({
      ...baseInquiry,
      requestType: 'BUG_REPORT',
    }));
    jest.mocked(inquiryService.adminUpdateStatus).mockResolvedValue(apiSuccess({
      inquiry: completedInquiry,
      emailOutcome: 'NOT_REQUESTED',
      emailMessage: '',
      templateSettingsUrl: null,
    }));

    render(<AdminInquiryDetailPage />);

    const statusSelect = await screen.findByLabelText('처리 상태');
    fireEvent.change(statusSelect, { target: { value: 'COMPLETED' } });
    fireEvent.click(screen.getByRole('button', { name: '처리 완료로 변경' }));
    expect(screen.getByRole('dialog').textContent).toContain('사용자에게 별도 답변을 등록하지 않고 상태를 종료합니다');
    expect(inquiryService.adminUpdateStatus).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '답변 없이 상태 변경' }));
    await waitFor(() => {
      expect(inquiryService.adminUpdateStatus).toHaveBeenCalledWith(42, 'COMPLETED', false);
    });
  });

  it('답변 없는 종료 dialog는 focus를 가두고 Escape 취소 후 trigger로 복귀한다', async () => {
    jest.mocked(inquiryService.adminGetOne).mockResolvedValue(apiSuccess({
      ...baseInquiry,
      requestType: 'BUG_REPORT',
    }));
    const { container } = render(<AdminInquiryDetailPage />);

    const statusSelect = await screen.findByLabelText('처리 상태');
    fireEvent.change(statusSelect, { target: { value: 'COMPLETED' } });
    const trigger = screen.getByRole('button', { name: '처리 완료로 변경' });
    fireEvent.click(trigger);

    const content = container.firstElementChild as HTMLElement;
    const cancel = screen.getByRole('button', { name: '취소' });
    const confirm = screen.getByRole('button', { name: '답변 없이 상태 변경' });
    const triggerFocus = jest.spyOn(trigger, 'focus');
    await waitFor(() => expect(document.activeElement).toBe(cancel));
    expect(content.hasAttribute('inert')).toBe(true);

    confirm.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(cancel);
    cancel.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(confirm);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(content.hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(triggerFocus).toHaveBeenCalledTimes(1);
  });

  it('답변 없는 종료 확인 요청이 끝나면 다시 활성화된 trigger로 focus를 복귀한다', async () => {
    const statusUpdateRequest = createDeferred<never>();
    jest.mocked(inquiryService.adminGetOne).mockResolvedValue(apiSuccess({
      ...baseInquiry,
      requestType: 'BUG_REPORT',
    }));
    jest.mocked(inquiryService.adminUpdateStatus).mockImplementation(() => statusUpdateRequest.promise);

    render(<AdminInquiryDetailPage />);

    const statusSelect = await screen.findByLabelText('처리 상태');
    fireEvent.change(statusSelect, { target: { value: 'COMPLETED' } });
    const trigger = screen.getByRole('button', { name: '처리 완료로 변경' }) as HTMLButtonElement;
    fireEvent.click(trigger);
    const triggerFocus = jest.spyOn(trigger, 'focus');
    fireEvent.click(screen.getByRole('button', { name: '답변 없이 상태 변경' }));

    await waitFor(() => expect(inquiryService.adminUpdateStatus).toHaveBeenCalled());
    expect(trigger.disabled).toBe(true);
    expect(document.activeElement).not.toBe(trigger);

    await act(async () => statusUpdateRequest.reject(new Error('상태 변경 실패')));

    await waitFor(() => {
      expect(trigger.disabled).toBe(false);
      expect(document.activeElement).toBe(trigger);
    });
    expect(triggerFocus).toHaveBeenCalledTimes(1);
  });

  it('답변 없는 종료 확인이 성공하면 상태 성공 메시지로 focus를 한 번 이동한다', async () => {
    const completedInquiry = {
      ...baseInquiry,
      requestType: 'BUG_REPORT' as const,
      status: 'COMPLETED' as const,
    };
    const successResponse = apiSuccess({
      inquiry: completedInquiry,
      emailOutcome: 'NOT_REQUESTED',
      emailMessage: '',
      templateSettingsUrl: null,
    });
    const statusUpdateRequest = createDeferred<typeof successResponse>();
    jest.mocked(inquiryService.adminGetOne).mockResolvedValue(apiSuccess({
      ...baseInquiry,
      requestType: 'BUG_REPORT',
    }));
    jest.mocked(inquiryService.adminUpdateStatus).mockImplementation(() => statusUpdateRequest.promise);

    render(<AdminInquiryDetailPage />);

    const statusSelect = await screen.findByLabelText('처리 상태');
    fireEvent.change(statusSelect, { target: { value: 'COMPLETED' } });
    fireEvent.click(screen.getByRole('button', { name: '처리 완료로 변경' }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: '취소' })));
    const focusSpy = jest.spyOn(HTMLElement.prototype, 'focus');
    fireEvent.click(screen.getByRole('button', { name: '답변 없이 상태 변경' }));

    try {
      await waitFor(() => expect(inquiryService.adminUpdateStatus).toHaveBeenCalled());
      expect(screen.queryByRole('status')).toBeNull();

      await act(async () => statusUpdateRequest.resolve(successResponse));

      const successStatus = await screen.findByRole('status');
      expect(successStatus.textContent).toBe('상태를 처리 완료로 변경했습니다.');
      expect(successStatus.getAttribute('tabindex')).toBe('-1');
      expect(successStatus.tabIndex).toBe(-1);
      expect(document.activeElement).toBe(successStatus);
      expect(focusSpy).toHaveBeenCalledTimes(1);
      expect(focusSpy.mock.instances[0]).toBe(successStatus);
    } finally {
      focusSpy.mockRestore();
    }
  });

  it('답변 없는 종료 승인은 dialog를 연 시점의 상태와 이메일 선택을 제출한다', async () => {
    const completedInquiry = { ...baseInquiry, requestType: 'BUG_REPORT' as const, status: 'COMPLETED' as const };
    jest.mocked(inquiryService.adminGetOne).mockResolvedValue(apiSuccess({
      ...baseInquiry,
      requestType: 'BUG_REPORT',
    }));
    jest.mocked(inquiryService.adminUpdateStatus).mockResolvedValue(apiSuccess({
      inquiry: completedInquiry,
      emailOutcome: 'QUEUED',
      emailMessage: '상태 안내 이메일을 발송 대기열에 등록했습니다.',
      templateSettingsUrl: null,
    }));

    render(<AdminInquiryDetailPage />);

    const statusSelect = await screen.findByLabelText('처리 상태');
    fireEvent.change(statusSelect, { target: { value: 'COMPLETED' } });
    fireEvent.click(screen.getByLabelText('상태 변경 안내 이메일 발송'));
    fireEvent.click(screen.getByRole('button', { name: '처리 완료로 변경' }));

    fireEvent.change(statusSelect, { target: { value: 'UNABLE_TO_PROCESS' } });
    fireEvent.click(screen.getByRole('button', { name: '답변 없이 상태 변경' }));

    await waitFor(() => {
      expect(inquiryService.adminUpdateStatus).toHaveBeenCalledWith(42, 'COMPLETED', true);
    });
  });

  it('열린 상태에는 상태 이메일 옵션을 표시하지 않고 같은 상태 변경을 막는다', async () => {
    render(<AdminInquiryDetailPage />);

    const statusSelect = await screen.findByLabelText('처리 상태');
    fireEvent.change(statusSelect, { target: { value: 'PENDING' } });
    expect(screen.queryByLabelText('상태 변경 안내 이메일 발송')).toBeNull();

    fireEvent.change(statusSelect, { target: { value: 'IN_PROGRESS' } });
    expect((screen.getByRole('button', { name: '검토 중로 변경' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('활성 binding이 없으면 상태 이메일 선택을 막고 설정 링크를 제공한다', async () => {
    jest.mocked(inquiryService.adminGetOne).mockResolvedValue(apiSuccess({
      ...baseInquiry,
      requestType: 'BUG_REPORT',
    }));
    jest.mocked(emailTemplateService.getBindings).mockResolvedValue(apiSuccess([{
      eventCode: 'INQUIRY_COMPLETED',
      eventLabel: '처리 완료',
      scope: 'INQUIRY_STATUS',
      templateId: null,
      templateName: null,
      templateActive: null,
      configured: false,
      sendable: false,
      unavailableReason: '템플릿 미설정',
    }]));

    render(<AdminInquiryDetailPage />);

    const statusSelect = await screen.findByLabelText('처리 상태');
    fireEvent.change(statusSelect, { target: { value: 'COMPLETED' } });
    expect((screen.getByLabelText('상태 변경 안내 이메일 발송') as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByText('템플릿 미설정')).toBeTruthy();
    expect(screen.getByRole('link', { name: '이메일 템플릿 관리' }).getAttribute('href'))
      .toBe('/admin/email-templates?tab=bindings');
  });

  it('상태 성공과 이메일 미발송 경고를 함께 표시한다', async () => {
    const inquiryWithAdminMessage: InquiryDetail = {
      ...baseInquiry,
      requestType: 'BUG_REPORT',
      messages: [{
        id: 11,
        authorId: 1,
        authorRole: 'ADMIN',
        content: '확인했습니다.',
        createdAt: '2026-08-28T11:00:00',
        imageUrls: [],
      }],
    };
    jest.mocked(inquiryService.adminGetOne).mockResolvedValue(apiSuccess(inquiryWithAdminMessage));
    jest.mocked(inquiryService.adminUpdateStatus).mockResolvedValue(apiSuccess({
      inquiry: { ...inquiryWithAdminMessage, status: 'COMPLETED' },
      emailOutcome: 'SKIPPED_TEMPLATE_INACTIVE',
      emailMessage: '연결된 이메일 템플릿이 비활성 상태여서 상태만 변경했습니다.',
      templateSettingsUrl: '/admin/email-templates?tab=bindings',
    }));

    render(<AdminInquiryDetailPage />);

    const statusSelect = await screen.findByLabelText('처리 상태');
    fireEvent.change(statusSelect, { target: { value: 'COMPLETED' } });
    fireEvent.click(screen.getByLabelText('상태 변경 안내 이메일 발송'));
    fireEvent.click(screen.getByRole('button', { name: '처리 완료로 변경' }));

    expect(await screen.findByText('상태를 처리 완료로 변경했습니다.')).toBeTruthy();
    expect(screen.getByText(/비활성 상태여서 상태만 변경/)).toBeTruthy();
    expect(inquiryService.adminUpdateStatus).toHaveBeenCalledWith(42, 'COMPLETED', true);
  });

  it('이메일이 대기열에 등록되면 발송 목록을 갱신한다', async () => {
    const inquiryWithAdminMessage: InquiryDetail = {
      ...baseInquiry,
      requestType: 'BUG_REPORT',
      messages: [{
        id: 12,
        authorId: 1,
        authorRole: 'ADMIN',
        content: '처리 결과입니다.',
        createdAt: '2026-08-28T11:00:00',
        imageUrls: [],
      }],
    };
    jest.mocked(inquiryService.adminGetOne).mockResolvedValue(apiSuccess(inquiryWithAdminMessage));
    jest.mocked(inquiryService.adminUpdateStatus).mockResolvedValue(apiSuccess({
      inquiry: { ...inquiryWithAdminMessage, status: 'COMPLETED' },
      emailOutcome: 'QUEUED',
      emailMessage: '상태 안내 이메일을 발송 대기열에 등록했습니다.',
      templateSettingsUrl: null,
    }));

    render(<AdminInquiryDetailPage />);

    const statusSelect = await screen.findByLabelText('처리 상태');
    fireEvent.change(statusSelect, { target: { value: 'COMPLETED' } });
    fireEvent.click(screen.getByLabelText('상태 변경 안내 이메일 발송'));
    const callsBeforeUpdate = jest.mocked(inquiryService.getEmailDeliveries).mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: '처리 완료로 변경' }));

    await waitFor(() => {
      expect(inquiryService.getEmailDeliveries).toHaveBeenCalledTimes(callsBeforeUpdate + 1);
    });
  });

  it('최신 발송 이력 요청이 대기 중이면 오래된 응답은 data와 loading을 변경하지 않는다', async () => {
    const inquiryWithAdminMessage: InquiryDetail = {
      ...baseInquiry,
      requestType: 'BUG_REPORT',
      messages: [{
        id: 13,
        authorId: 1,
        authorRole: 'ADMIN',
        content: '처리 결과입니다.',
        createdAt: '2026-08-28T11:00:00',
        imageUrls: [],
      }],
    };
    const oldResponse = apiSuccess({
      content: [{
        id: 101,
        inquiryId: 42,
        inquiryMessageId: null,
        eventType: 'ADMIN_MESSAGE' as const,
        status: 'SENT' as const,
        recipientEmail: 'user@example.com',
        subject: '오래된 발송 이력',
        htmlContent: true,
        attemptCount: 1,
        lastError: null,
        createdAt: '2026-08-28T11:00:00',
        sentAt: '2026-08-28T11:00:01',
      }],
      totalElements: 1,
      totalPages: 1,
      page: 0,
      size: 20,
    });
    const latestResponse = apiSuccess({
      content: [{
        id: 102,
        inquiryId: 42,
        inquiryMessageId: null,
        eventType: 'COMPLETED' as const,
        status: 'PENDING' as const,
        recipientEmail: 'user@example.com',
        subject: '최신 발송 이력',
        htmlContent: true,
        attemptCount: 0,
        lastError: null,
        createdAt: '2026-08-28T12:00:00',
        sentAt: null,
      }],
      totalElements: 1,
      totalPages: 1,
      page: 0,
      size: 20,
    });
    const oldRequest = createDeferred<typeof oldResponse>();
    const latestRequest = createDeferred<typeof latestResponse>();
    jest.mocked(inquiryService.adminGetOne).mockResolvedValue(apiSuccess(inquiryWithAdminMessage));
    jest.mocked(inquiryService.adminUpdateStatus).mockResolvedValue(apiSuccess({
      inquiry: { ...inquiryWithAdminMessage, status: 'COMPLETED' },
      emailOutcome: 'QUEUED',
      emailMessage: '상태 안내 이메일을 발송 대기열에 등록했습니다.',
      templateSettingsUrl: null,
    }));
    jest.mocked(inquiryService.getEmailDeliveries)
      .mockImplementationOnce(() => oldRequest.promise)
      .mockImplementationOnce(() => latestRequest.promise);

    render(<AdminInquiryDetailPage />);
    const statusSelect = await screen.findByLabelText('처리 상태');
    fireEvent.change(statusSelect, { target: { value: 'COMPLETED' } });
    fireEvent.click(screen.getByLabelText('상태 변경 안내 이메일 발송'));
    fireEvent.click(screen.getByRole('button', { name: '처리 완료로 변경' }));
    await waitFor(() => expect(inquiryService.getEmailDeliveries).toHaveBeenCalledTimes(2));

    await act(async () => oldRequest.resolve(oldResponse));
    expect(screen.queryByText('오래된 발송 이력')).toBeNull();
    expect((screen.getByRole('button', { name: '발송 이력 새로고침' }) as HTMLButtonElement).disabled).toBe(true);

    await act(async () => latestRequest.resolve(latestResponse));
    expect(await screen.findByText('최신 발송 이력')).toBeTruthy();
  });

  it('최신 발송 이력이 표시된 뒤 완료된 오래된 응답은 화면을 덮어쓰지 않는다', async () => {
    const inquiryWithAdminMessage: InquiryDetail = {
      ...baseInquiry,
      requestType: 'BUG_REPORT',
      messages: [{
        id: 14,
        authorId: 1,
        authorRole: 'ADMIN',
        content: '처리 결과입니다.',
        createdAt: '2026-08-28T11:00:00',
        imageUrls: [],
      }],
    };
    const oldResponse = apiSuccess({
      content: [{
        id: 103,
        inquiryId: 42,
        inquiryMessageId: null,
        eventType: 'ADMIN_MESSAGE' as const,
        status: 'SENT' as const,
        recipientEmail: 'user@example.com',
        subject: '늦게 도착한 오래된 이력',
        htmlContent: false,
        attemptCount: 1,
        lastError: null,
        createdAt: '2026-08-28T11:00:00',
        sentAt: '2026-08-28T11:00:01',
      }],
      totalElements: 1,
      totalPages: 1,
      page: 0,
      size: 20,
    });
    const latestResponse = apiSuccess({
      content: [{
        id: 104,
        inquiryId: 42,
        inquiryMessageId: null,
        eventType: 'COMPLETED' as const,
        status: 'PENDING' as const,
        recipientEmail: 'user@example.com',
        subject: '먼저 도착한 최신 이력',
        htmlContent: true,
        attemptCount: 0,
        lastError: null,
        createdAt: '2026-08-28T12:00:00',
        sentAt: null,
      }],
      totalElements: 1,
      totalPages: 1,
      page: 0,
      size: 20,
    });
    const oldRequest = createDeferred<typeof oldResponse>();
    const latestRequest = createDeferred<typeof latestResponse>();
    jest.mocked(inquiryService.adminGetOne).mockResolvedValue(apiSuccess(inquiryWithAdminMessage));
    jest.mocked(inquiryService.adminUpdateStatus).mockResolvedValue(apiSuccess({
      inquiry: { ...inquiryWithAdminMessage, status: 'COMPLETED' },
      emailOutcome: 'QUEUED',
      emailMessage: '상태 안내 이메일을 발송 대기열에 등록했습니다.',
      templateSettingsUrl: null,
    }));
    jest.mocked(inquiryService.getEmailDeliveries)
      .mockImplementationOnce(() => oldRequest.promise)
      .mockImplementationOnce(() => latestRequest.promise);

    render(<AdminInquiryDetailPage />);
    const statusSelect = await screen.findByLabelText('처리 상태');
    fireEvent.change(statusSelect, { target: { value: 'COMPLETED' } });
    fireEvent.click(screen.getByLabelText('상태 변경 안내 이메일 발송'));
    fireEvent.click(screen.getByRole('button', { name: '처리 완료로 변경' }));
    await waitFor(() => expect(inquiryService.getEmailDeliveries).toHaveBeenCalledTimes(2));

    await act(async () => latestRequest.resolve(latestResponse));
    expect(await screen.findByText('먼저 도착한 최신 이력')).toBeTruthy();

    await act(async () => oldRequest.resolve(oldResponse));
    expect(screen.queryByText('늦게 도착한 오래된 이력')).toBeNull();
    expect(screen.getByText('먼저 도착한 최신 이력')).toBeTruthy();
  });

  it('다시 열기는 상태 메시지 없이 이메일 미발송으로 요청한다', async () => {
    jest.mocked(inquiryService.adminGetOne).mockResolvedValue(apiSuccess({
      ...baseInquiry,
      status: 'ANSWERED',
    }));
    jest.mocked(inquiryService.adminUpdateStatus).mockResolvedValue(apiSuccess({
      inquiry: { ...baseInquiry, status: 'IN_PROGRESS' },
      emailOutcome: 'NOT_REQUESTED',
      emailMessage: '',
      templateSettingsUrl: null,
    }));

    render(<AdminInquiryDetailPage />);

    fireEvent.click(await screen.findByRole('button', { name: '다시 열기' }));
    await waitFor(() => {
      expect(inquiryService.adminUpdateStatus).toHaveBeenCalledWith(42, 'IN_PROGRESS', false);
    });
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
        htmlContent: true,
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
          htmlContent: false,
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
