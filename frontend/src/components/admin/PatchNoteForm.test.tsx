import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, jest } from '@jest/globals';
import type { PatchNoteRequest } from '@/types';

jest.mock('@/components/ui/RichTextEditor', () => ({
  __esModule: true,
  RichTextEditor: ({ value, onChange }: { value: string; onChange: (html: string) => void }) => (
    <textarea aria-label="본문" value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}));

const PatchNoteForm = require('./PatchNoteForm').PatchNoteForm as typeof import('./PatchNoteForm').PatchNoteForm;

describe('PatchNoteForm', () => {
  it('시각적으로 빈 본문은 제출하지 않고 오류를 표시한다', () => {
    const onSubmit = jest.fn<(request: PatchNoteRequest) => Promise<void>>().mockResolvedValue(undefined);

    render(<PatchNoteForm onSubmit={onSubmit} submitLabel="등록" cancelHref="/admin/patch-notes" />);

    fireEvent.change(screen.getByLabelText('제목'), { target: { value: '배포 안내' } });
    fireEvent.change(screen.getByLabelText('버전'), { target: { value: 'v1.0.0' } });
    fireEvent.change(screen.getByLabelText('본문'), { target: { value: '<p>&nbsp;</p>' } });
    fireEvent.click(screen.getByRole('button', { name: '등록' }));

    expect(screen.getByRole('alert').textContent).toContain('본문을 입력해 주세요');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('제출 중에는 중복 제출을 막고 정리된 요청을 한 번만 전달한다', async () => {
    let resolveSubmit: (() => void) | undefined;
    const onSubmit = jest.fn<(request: PatchNoteRequest) => Promise<void>>(
      () => new Promise<void>((resolve) => { resolveSubmit = resolve; }),
    );

    render(<PatchNoteForm onSubmit={onSubmit} submitLabel="등록" cancelHref="/admin/patch-notes" />);

    fireEvent.change(screen.getByLabelText('제목'), { target: { value: ' 배포 안내 ' } });
    fireEvent.change(screen.getByLabelText('버전'), { target: { value: ' v1.0.0 ' } });
    fireEvent.change(screen.getByLabelText('본문'), { target: { value: '<p>변경 사항</p>' } });
    fireEvent.click(screen.getByRole('button', { name: '등록' }));
    fireEvent.click(screen.getByRole('button', { name: '등록 중...' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      title: '배포 안내',
      version: 'v1.0.0',
      content: '<p>변경 사항</p>',
      published: true,
    });

    resolveSubmit?.();
    await waitFor(() => expect(screen.getByRole('button', { name: '등록' })).not.toBeNull());
  });

  it('HTTP 오류 응답의 백엔드 메시지를 사용자에게 표시한다', async () => {
    const onSubmit = jest.fn<(request: PatchNoteRequest) => Promise<void>>().mockRejectedValue({
      message: 'Request failed with status code 400',
      response: {
        data: {
          success: false,
          error: { code: 'INVALID_PATCH_NOTE', message: '버전 형식이 올바르지 않습니다.' },
          timestamp: '2026-08-26T09:00:00',
        },
      },
    });

    render(<PatchNoteForm onSubmit={onSubmit} submitLabel="등록" cancelHref="/admin/patch-notes" />);

    fireEvent.change(screen.getByLabelText('제목'), { target: { value: '배포 안내' } });
    fireEvent.change(screen.getByLabelText('버전'), { target: { value: 'v1.0.0' } });
    fireEvent.change(screen.getByLabelText('본문'), { target: { value: '<p>변경 사항</p>' } });
    fireEvent.click(screen.getByRole('button', { name: '등록' }));

    expect((await screen.findByRole('alert')).textContent).toContain('버전 형식이 올바르지 않습니다.');
  });
});
