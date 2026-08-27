import { beforeEach, describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { inquiryService } from '@/services/inquiryService';
import InquirySettingsPage from './page';

declare const jest: typeof import('@jest/globals').jest;

jest.mock('@/services/inquiryService', () => ({
  inquiryService: {
    getNotificationSettings: jest.fn(),
    updateNotificationSettings: jest.fn(),
  },
}));

function apiSuccess<T>(data: T) {
  return { data: { success: true, data } } as never;
}

describe('InquirySettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(inquiryService.getNotificationSettings).mockResolvedValue(apiSuccess({
      enabled: true,
      recipientEmails: ['first@example.com'],
    }));
    jest.mocked(inquiryService.updateNotificationSettings).mockResolvedValue(apiSuccess({
      enabled: true,
      recipientEmails: ['admin@example.com'],
    }));
  });

  it('GET 설정을 표시하고 정규화한 주소를 PUT으로 저장한다', async () => {
    render(<InquirySettingsPage />);

    const input = await screen.findByDisplayValue('first@example.com');
    fireEvent.change(input, { target: { value: '  ADMIN@Example.COM  ' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(inquiryService.updateNotificationSettings).toHaveBeenCalledWith(
        true,
        ['admin@example.com'],
      );
    });
  });

  it('공백과 대소문자를 정규화했을 때 중복인 주소는 저장하지 않는다', async () => {
    render(<InquirySettingsPage />);

    await screen.findByDisplayValue('first@example.com');
    fireEvent.click(screen.getByRole('button', { name: '주소 추가' }));
    const inputs = screen.getAllByLabelText(/수신 이메일/);
    fireEvent.change(inputs[0], { target: { value: 'Admin@Example.com' } });
    fireEvent.change(inputs[1], { target: { value: ' admin@example.COM ' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('중복된 이메일 주소가 있습니다.')).toBeTruthy();
    expect(inquiryService.updateNotificationSettings).not.toHaveBeenCalled();
  });

  it('활성화 상태에서는 수신 이메일을 최소 1개 요구한다', async () => {
    render(<InquirySettingsPage />);

    const input = await screen.findByDisplayValue('first@example.com');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('알림을 사용하려면 수신 이메일을 1개 이상 입력해 주세요.')).toBeTruthy();
    expect(inquiryService.updateNotificationSettings).not.toHaveBeenCalled();
  });

  it('이메일 형식을 검증하고 주소 추가를 최대 10개로 제한한다', async () => {
    render(<InquirySettingsPage />);

    const firstInput = await screen.findByDisplayValue('first@example.com');
    fireEvent.change(firstInput, { target: { value: 'invalid-email' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByText('올바른 이메일 주소를 입력해 주세요.')).toBeTruthy();

    const addButton = screen.getByRole('button', { name: '주소 추가' }) as HTMLButtonElement;
    for (let count = 1; count < 10; count += 1) fireEvent.click(addButton);
    expect(screen.getAllByLabelText(/수신 이메일/)).toHaveLength(10);
    expect(addButton.disabled).toBe(true);
  });

  it('서버가 반환한 저장 오류 메시지를 표시한다', async () => {
    jest.mocked(inquiryService.updateNotificationSettings).mockRejectedValue({
      response: {
        data: {
          success: false,
          error: { code: 'INVALID_INQUIRY_NOTIFICATION_SETTINGS', message: '수신 주소 설정을 확인해 주세요.' },
        },
      },
    });

    render(<InquirySettingsPage />);

    await screen.findByDisplayValue('first@example.com');
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('수신 주소 설정을 확인해 주세요.')).toBeTruthy();
  });
});
