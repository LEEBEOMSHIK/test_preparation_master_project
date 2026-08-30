import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { UploadImageResult } from '@/services/inquiryService';
import { InquiryImageUploader } from './InquiryImageUploader';

function createImageFile(name: string, type = 'image/png', size = 4): File {
  return new File([new Uint8Array(size)], name, { type });
}

function createUploadImageMock() {
  return jest.fn<(file: File) => Promise<UploadImageResult>>();
}

const originalCreateObjectUrl = URL.createObjectURL;
const originalRevokeObjectUrl = URL.revokeObjectURL;

afterEach(() => {
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    writable: true,
    value: originalCreateObjectUrl,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    writable: true,
    value: originalRevokeObjectUrl,
  });
});

describe('InquiryImageUploader', () => {
  it('명확한 드롭존에서 여러 이미지를 한 번에 추가하고 파일 정보를 표시한다', async () => {
    const uploadImage = createUploadImageMock()
      .mockResolvedValueOnce({ id: 11, url: '/uploads/inquiries/first.png' })
      .mockResolvedValueOnce({ id: 12, url: '/uploads/inquiries/second.png' });
    const onChange = jest.fn();
    const { container } = render(
      <InquiryImageUploader uploadImage={uploadImage} onChange={onChange} />,
    );
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const first = createImageFile('first.png', 'image/png', 1024);
    const second = createImageFile('second.webp', 'image/webp', 2048);

    fireEvent.change(fileInput, { target: { files: [first, second] } });

    expect(screen.getByText('최대 3장, 파일당 10MB 이하, JPG/JPEG/PNG/GIF/WebP')).toBeTruthy();
    expect(await screen.findByText('first.png')).toBeTruthy();
    expect(screen.getByText('second.webp')).toBeTruthy();
    expect(screen.getAllByText('업로드 완료')).toHaveLength(2);
    expect(uploadImage).toHaveBeenCalledWith(first);
    expect(uploadImage).toHaveBeenCalledWith(second);
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ id: 11, fileName: 'first.png', fileSize: 1024 }),
      expect.objectContaining({ id: 12, fileName: 'second.webp', fileSize: 2048 }),
    ]));
  });

  it('drag and drop에서 지원하지 않는 형식, 10MB 초과, 남은 슬롯 초과 파일을 업로드 전에 거부한다', async () => {
    const uploadImage = createUploadImageMock().mockResolvedValue({ id: 1, url: '/uploads/inquiries/valid.png' });
    const { container } = render(<InquiryImageUploader uploadImage={uploadImage} onChange={() => undefined} />);
    const dropzone = screen.getByRole('button', { name: /이미지 파일 선택 또는 드래그 앤 드롭/ });
    const tooLarge = createImageFile('large.png', 'image/png', 10 * 1024 * 1024 + 1);
    const unsupported = createImageFile('document.pdf', 'application/pdf');
    const validFiles = [
      createImageFile('one.png'),
      createImageFile('two.png'),
      createImageFile('three.png'),
      createImageFile('four.png'),
    ];

    fireEvent.drop(dropzone, { dataTransfer: { files: [tooLarge, unsupported, ...validFiles] } });

    await waitFor(() => {
      expect(screen.getByText(/large\.png: 파일당 10MB 이하/)).toBeTruthy();
      expect(screen.getByText(/document\.pdf: JPG\/JPEG\/PNG\/GIF\/WebP 형식만/)).toBeTruthy();
      expect(screen.getByText(/최대 3장까지 첨부할 수 있습니다\. 4장 중 1장은 추가되지 않았습니다/)).toBeTruthy();
    });
    expect(uploadImage).toHaveBeenCalledTimes(3);
    expect(container.querySelector('input[type="file"]')).toBeTruthy();
  });

  it('업로드 중 상태를 표시하고 파일별 삭제 버튼으로 첨부를 제거한다', async () => {
    let resolveUpload: ((value: { id: number; url: string }) => void) | undefined;
    const uploadImage = createUploadImageMock().mockImplementation(() => new Promise<UploadImageResult>((resolve) => {
      resolveUpload = resolve;
    }));
    const { container } = render(<InquiryImageUploader uploadImage={uploadImage} onChange={() => undefined} />);
    const file = createImageFile('progress.gif', 'image/gif', 512);

    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    });
    expect(await screen.findByText('업로드 중')).toBeTruthy();
    resolveUpload?.({ id: 17, url: '/uploads/inquiries/progress.gif' });
    expect(await screen.findByText('업로드 완료')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'progress.gif 삭제' }));
    expect(screen.queryByText('progress.gif')).toBeNull();
  });

  it('업로드 실패 시 오류를 표시하고 preview object URL을 즉시 한 번만 해제한다', async () => {
    const createObjectUrl = jest.fn(() => 'blob:failed-upload');
    const revokeObjectUrl = jest.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectUrl,
    });
    const uploadImage = createUploadImageMock().mockRejectedValue({
      response: { data: { success: false, error: { code: 'UPLOAD_FAILED', message: '서버 저장소가 가득 찼습니다.' } } },
    });
    const { container, unmount } = render(
      <InquiryImageUploader uploadImage={uploadImage} onChange={() => undefined} />,
    );

    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [createImageFile('failed.png')] },
    });

    expect((await screen.findByRole('alert')).textContent).toContain('서버 저장소가 가득 찼습니다.');
    await waitFor(() => expect(screen.queryByText('failed.png')).toBeNull());
    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:failed-upload');
    unmount();
    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);
  });

  it('확장자가 png여도 MIME 타입이 비어 있으면 업로드 전에 거부한다', async () => {
    const uploadImage = createUploadImageMock().mockResolvedValue({ id: 25, url: '/uploads/no-mime.png' });
    const { container } = render(<InquiryImageUploader uploadImage={uploadImage} onChange={() => undefined} />);

    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [createImageFile('no-mime.png', '')] },
    });

    expect((await screen.findByRole('alert')).textContent).toContain('no-mime.png: JPG/JPEG/PNG/GIF/WebP 형식만 첨부할 수 있습니다.');
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it('정확히 10MB인 허용 MIME 이미지 파일은 업로드한다', async () => {
    const uploadImage = createUploadImageMock().mockResolvedValue({ id: 26, url: '/uploads/exact-limit.png' });
    const { container } = render(<InquiryImageUploader uploadImage={uploadImage} onChange={() => undefined} />);
    const exactLimit = createImageFile('exact-limit.png', 'image/png', 10 * 1024 * 1024);

    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [exactLimit] },
    });

    expect(await screen.findByText('업로드 완료')).toBeTruthy();
    expect(uploadImage).toHaveBeenCalledWith(exactLimit);
  });

  it('미해결 업로드 항목을 삭제한 뒤 reject되어도 URL을 다시 해제하거나 오류를 표시하지 않는다', async () => {
    let rejectUpload: ((reason?: unknown) => void) | undefined;
    const createObjectUrl = jest.fn(() => 'blob:deleted-pending-upload');
    const revokeObjectUrl = jest.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectUrl,
    });
    const uploadImage = createUploadImageMock().mockImplementation(() => new Promise<never>((_, reject) => {
      rejectUpload = reject;
    }));
    const { container } = render(<InquiryImageUploader uploadImage={uploadImage} onChange={() => undefined} />);

    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [createImageFile('deleted-pending.png')] },
    });
    expect(await screen.findByText('업로드 중')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'deleted-pending.png 삭제' }));
    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);

    rejectUpload?.({
      response: { data: { success: false, error: { code: 'UPLOAD_FAILED', message: '늦은 업로드 오류' } } },
    });

    await waitFor(() => expect(revokeObjectUrl).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('deleted-pending.png')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('unmount 뒤 지연된 업로드 resolve가 상태나 콜백을 갱신하지 않는다', async () => {
    let resolveUpload: ((value: { id: number; url: string }) => void) | undefined;
    const createObjectUrl = jest.fn(() => 'blob:unmounted-resolve');
    const revokeObjectUrl = jest.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectUrl,
    });
    const uploadImage = createUploadImageMock().mockImplementation(() => new Promise<UploadImageResult>((resolve) => {
      resolveUpload = resolve;
    }));
    const onChange = jest.fn();
    const onUploadingChange = jest.fn();
    const { container, unmount } = render(
      <InquiryImageUploader uploadImage={uploadImage} onChange={onChange} onUploadingChange={onUploadingChange} />,
    );

    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [createImageFile('unmounted-resolve.png')] },
    });
    expect(await screen.findByText('업로드 중')).toBeTruthy();
    const changeCallsBeforeUnmount = onChange.mock.calls.length;
    const uploadingCallsBeforeUnmount = onUploadingChange.mock.calls.length;
    unmount();

    resolveUpload?.({ id: 41, url: '/uploads/unmounted-resolve.png' });
    await Promise.resolve();
    await Promise.resolve();

    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls).toHaveLength(changeCallsBeforeUnmount);
    expect(onUploadingChange.mock.calls).toHaveLength(uploadingCallsBeforeUnmount);
  });

  it('unmount 뒤 지연된 업로드 reject가 URL을 다시 해제하거나 상태·콜백을 갱신하지 않는다', async () => {
    let rejectUpload: ((reason?: unknown) => void) | undefined;
    const createObjectUrl = jest.fn(() => 'blob:unmounted-reject');
    const revokeObjectUrl = jest.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectUrl,
    });
    const uploadImage = createUploadImageMock().mockImplementation(() => new Promise<never>((_, reject) => {
      rejectUpload = reject;
    }));
    const onChange = jest.fn();
    const onUploadingChange = jest.fn();
    const { container, unmount } = render(
      <InquiryImageUploader uploadImage={uploadImage} onChange={onChange} onUploadingChange={onUploadingChange} />,
    );

    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [createImageFile('unmounted-reject.png')] },
    });
    expect(await screen.findByText('업로드 중')).toBeTruthy();
    const changeCallsBeforeUnmount = onChange.mock.calls.length;
    const uploadingCallsBeforeUnmount = onUploadingChange.mock.calls.length;
    unmount();

    rejectUpload?.(new Error('늦은 업로드 오류'));
    await Promise.resolve();
    await Promise.resolve();

    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls).toHaveLength(changeCallsBeforeUnmount);
    expect(onUploadingChange.mock.calls).toHaveLength(uploadingCallsBeforeUnmount);
  });
});
