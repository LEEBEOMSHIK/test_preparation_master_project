import { describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { inquiryService } from '@/services/inquiryService';
import { InquiryMessageComposer } from './InquiryMessageComposer';

declare const jest: typeof import('@jest/globals').jest;

jest.mock('@/services/inquiryService', () => ({
  inquiryService: {
    adminAddMessage: jest.fn(),
    addMessage: jest.fn(),
    uploadMessageImage: jest.fn(),
  },
}));

describe('InquiryMessageComposer', () => {
  it('keeps the admin email notification unchecked initially', () => {
    render(<InquiryMessageComposer inquiryId={1} admin onSent={() => undefined} />);
    expect((screen.getByLabelText('사용자에게 이메일 알림 발송') as HTMLInputElement).checked).toBe(false);
  });

  it('resets the admin email notification after a successful message', async () => {
    jest.mocked(inquiryService.adminAddMessage).mockResolvedValue({
      data: { success: true, data: null },
    } as never);
    const onSent = jest.fn();
    render(<InquiryMessageComposer inquiryId={1} admin onSent={onSent} />);

    fireEvent.change(screen.getByPlaceholderText('추가 내용을 입력해 주세요.'), {
      target: { value: '중간 답변입니다.' },
    });
    const emailCheckbox = screen.getByLabelText('사용자에게 이메일 알림 발송') as HTMLInputElement;
    fireEvent.click(emailCheckbox);
    fireEvent.click(screen.getByRole('button', { name: '메시지 등록' }));

    await waitFor(() => {
      expect(inquiryService.adminAddMessage).toHaveBeenCalledWith(
        1,
        '중간 답변입니다.',
        [],
        true,
      );
    });
    expect(emailCheckbox.checked).toBe(false);
    expect(onSent).toHaveBeenCalledTimes(1);
  });
});
