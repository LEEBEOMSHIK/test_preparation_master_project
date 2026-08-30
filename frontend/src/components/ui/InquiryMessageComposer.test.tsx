import { beforeEach, describe, expect, it } from '@jest/globals';
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps the admin email notification unchecked initially', () => {
    render(<InquiryMessageComposer inquiryId={1} admin onSent={() => undefined} />);
    expect((screen.getByLabelText('사용자에게 이메일 알림 발송') as HTMLInputElement).checked).toBe(false);
  });

  it('후속 메시지 입력란에 명확한 접근성 이름을 제공한다', () => {
    render(<InquiryMessageComposer inquiryId={1} onSent={() => undefined} />);
    expect(screen.getByLabelText('추가 메시지 내용')).toBeTruthy();
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

  it('uploads a user message image and sends its id in attachmentIds', async () => {
    jest.mocked(inquiryService.uploadMessageImage).mockResolvedValue({
      data: { success: true, data: { id: 77, url: '/uploads/inquiries/messages/bug.png' } },
    } as never);
    jest.mocked(inquiryService.addMessage).mockResolvedValue({
      data: { success: true, data: null },
    } as never);
    const onSent = jest.fn();
    const { container } = render(
      <InquiryMessageComposer inquiryId={9} onSent={onSent} />,
    );
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['image-bytes'], 'bug.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(await screen.findByRole('button', { name: 'bug.png 삭제' })).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText('추가 내용을 입력해 주세요.'), {
      target: { value: '  이미지 포함 메시지  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: '메시지 등록' }));

    await waitFor(() => {
      expect(inquiryService.uploadMessageImage).toHaveBeenCalledWith(file);
      expect(inquiryService.addMessage).toHaveBeenCalledWith(
        9,
        '이미지 포함 메시지',
        [77],
      );
    });
    expect(onSent).toHaveBeenCalledTimes(1);
  });

  it('공통 드롭존에서 여러 이미지를 첨부하고 모든 ID를 사용자 메시지에 전송한다', async () => {
    jest.mocked(inquiryService.uploadMessageImage)
      .mockResolvedValueOnce({
        data: { success: true, data: { id: 81, url: '/uploads/inquiries/messages/first.png' } },
      } as never)
      .mockResolvedValueOnce({
        data: { success: true, data: { id: 82, url: '/uploads/inquiries/messages/second.webp' } },
      } as never);
    jest.mocked(inquiryService.addMessage).mockResolvedValue({
      data: { success: true, data: null },
    } as never);
    render(<InquiryMessageComposer inquiryId={9} onSent={() => undefined} />);
    const first = new File(['first'], 'first.png', { type: 'image/png' });
    const second = new File(['second'], 'second.webp', { type: 'image/webp' });

    expect(screen.getByRole('button', { name: /이미지 파일 선택 또는 드래그 앤 드롭/ })).toBeTruthy();
    fireEvent.drop(screen.getByRole('button', { name: /이미지 파일 선택 또는 드래그 앤 드롭/ }), {
      dataTransfer: { files: [first, second] },
    });
    await screen.findAllByText('업로드 완료');
    fireEvent.change(screen.getByPlaceholderText('추가 내용을 입력해 주세요.'), {
      target: { value: '여러 이미지 메시지' },
    });
    fireEvent.click(screen.getByRole('button', { name: '메시지 등록' }));

    await waitFor(() => expect(inquiryService.addMessage).toHaveBeenCalledWith(
      9,
      '여러 이미지 메시지',
      [81, 82],
    ));
  });

  it('서버가 전달한 메시지 등록 오류를 alert로 표시한다', async () => {
    jest.mocked(inquiryService.addMessage).mockRejectedValue({
      response: { data: { success: false, error: { code: 'CONFLICT', message: '이미 종료된 문의입니다.' } } },
    });
    render(<InquiryMessageComposer inquiryId={9} onSent={() => undefined} />);

    fireEvent.change(screen.getByPlaceholderText('추가 내용을 입력해 주세요.'), {
      target: { value: '추가 메시지' },
    });
    fireEvent.click(screen.getByRole('button', { name: '메시지 등록' }));

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert.textContent).toContain('이미 종료된 문의입니다.');
  });

  it('이미지 업로드 중에는 메시지 등록 버튼을 비활성화하고 메시지 API를 호출하지 않는다', async () => {
    let resolveUpload: ((value: { data: { success: boolean; data: { id: number; url: string } } }) => void) | undefined;
    jest.mocked(inquiryService.uploadMessageImage).mockImplementation(() => new Promise((resolve) => {
      resolveUpload = resolve;
    }) as never);
    render(<InquiryMessageComposer inquiryId={9} onSent={() => undefined} />);

    fireEvent.change(screen.getByLabelText('이미지 파일 선택'), {
      target: { files: [new File(['image'], 'pending.png', { type: 'image/png' })] },
    });
    expect(await screen.findByText('업로드 중')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('추가 메시지 내용'), {
      target: { value: '업로드 대기 메시지' },
    });
    const submitButton = screen.getByRole('button', { name: '메시지 등록' }) as HTMLButtonElement;

    expect(submitButton.disabled).toBe(true);
    fireEvent.click(submitButton);
    expect(inquiryService.addMessage).not.toHaveBeenCalled();
    resolveUpload?.({ data: { success: true, data: { id: 92, url: '/uploads/messages/pending.png' } } });
    expect(await screen.findByText('업로드 완료')).toBeTruthy();
  });
});
