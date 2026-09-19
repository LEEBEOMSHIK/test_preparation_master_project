import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, jest } from '@jest/globals';
import type { PatchNoteRequest } from '@/types';

const PatchNoteForm = require('./PatchNoteForm').PatchNoteForm as typeof import('./PatchNoteForm').PatchNoteForm;

describe('PatchNoteForm', () => {
  const fillRequiredFields = () => {
    fireEvent.change(screen.getByLabelText('제목'), { target: { value: '배포 안내' } });
    fireEvent.change(screen.getByLabelText('버전'), { target: { value: 'v1.0.0' } });
  };

  it('기본 항목 행을 표시하고 항목 유형과 요약을 편집한다', () => {
    const onSubmit = jest.fn<(request: PatchNoteRequest) => Promise<void>>().mockResolvedValue(undefined);
    render(<PatchNoteForm onSubmit={onSubmit} submitLabel="등록" cancelHref="/admin/patch-notes" />);

    expect(screen.getByLabelText('항목 유형 1')).not.toBeNull();
    expect(screen.getByLabelText('항목 요약 1')).not.toBeNull();
    expect(screen.getByRole('button', { name: '항목 추가' })).not.toBeNull();
  });

  it('항목을 추가·삭제하고 위아래 순서를 payload에 반영한다', async () => {
    const onSubmit = jest.fn<(request: PatchNoteRequest) => Promise<void>>().mockResolvedValue(undefined);

    render(<PatchNoteForm onSubmit={onSubmit} submitLabel="등록" cancelHref="/admin/patch-notes" />);
    fillRequiredFields();
    fireEvent.change(screen.getByLabelText('항목 요약 1'), { target: { value: '첫 번째 변경' } });
    fireEvent.click(screen.getByRole('button', { name: '항목 추가' }));
    fireEvent.change(screen.getByLabelText('항목 유형 2'), { target: { value: 'FIX' } });
    fireEvent.change(screen.getByLabelText('항목 요약 2'), { target: { value: '두 번째 수정' } });
    fireEvent.click(screen.getByRole('button', { name: '항목 1 아래로 이동' }));
    fireEvent.click(screen.getByRole('button', { name: '등록' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      title: '배포 안내',
      version: 'v1.0.0',
      content: '두 번째 수정\n첫 번째 변경',
      published: true,
      items: [
        { itemType: 'FIX', summary: '두 번째 수정', displayOrder: 0 },
        { itemType: 'ETC', summary: '첫 번째 변경', displayOrder: 1 },
      ],
    });

    fireEvent.click(screen.getByRole('button', { name: '항목 1 삭제' }));
    expect((screen.getByLabelText('항목 요약 1') as HTMLInputElement).value).toBe('첫 번째 변경');
  });

  it('행별 필수값과 버전 형식을 검증한다', () => {
    const onSubmit = jest.fn<(request: PatchNoteRequest) => Promise<void>>().mockResolvedValue(undefined);

    render(<PatchNoteForm onSubmit={onSubmit} submitLabel="등록" cancelHref="/admin/patch-notes" />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: '등록' }));

    expect(screen.getByRole('alert').textContent).toContain('1번 항목 요약을 입력해 주세요.');
    expect(screen.getByLabelText('항목 요약 1').getAttribute('aria-invalid')).toBe('true');
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('항목 요약 1'), { target: { value: '변경 사항' } });
    fireEvent.change(screen.getByLabelText('버전'), { target: { value: '1.0' } });
    fireEvent.click(screen.getByRole('button', { name: '등록' }));

    expect(screen.getByRole('alert').textContent).toContain('vMAJOR.MINOR.PATCH');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('본문 편집기 없이 항목 요약을 줄바꿈한 content를 생성한다', async () => {
    const onSubmit = jest.fn<(request: PatchNoteRequest) => Promise<void>>().mockResolvedValue(undefined);

    render(<PatchNoteForm onSubmit={onSubmit} submitLabel="등록" cancelHref="/admin/patch-notes" />);

    fireEvent.change(screen.getByLabelText('제목'), { target: { value: '배포 안내' } });
    fireEvent.change(screen.getByLabelText('버전'), { target: { value: 'v1.0.0' } });
    fireEvent.change(screen.getByLabelText('항목 요약 1'), { target: { value: '새 기능을 추가했습니다.' } });
    fireEvent.click(screen.getByRole('button', { name: '항목 추가' }));
    fireEvent.change(screen.getByLabelText('항목 요약 2'), { target: { value: '오류를 수정했습니다.' } });
    fireEvent.click(screen.getByRole('button', { name: '등록' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      content: '새 기능을 추가했습니다.\n오류를 수정했습니다.',
    })));
    expect(screen.queryByLabelText('본문')).toBeNull();
  });

  it('제출 중에는 중복 제출을 막고 정리된 요청을 한 번만 전달한다', async () => {
    let resolveSubmit: (() => void) | undefined;
    const onSubmit = jest.fn<(request: PatchNoteRequest) => Promise<void>>(
      () => new Promise<void>((resolve) => { resolveSubmit = resolve; }),
    );

    render(<PatchNoteForm onSubmit={onSubmit} submitLabel="등록" cancelHref="/admin/patch-notes" />);

    fireEvent.change(screen.getByLabelText('제목'), { target: { value: ' 배포 안내 ' } });
    fireEvent.change(screen.getByLabelText('버전'), { target: { value: ' v1.0.0 ' } });
    fireEvent.change(screen.getByLabelText('항목 요약 1'), { target: { value: '변경 사항' } });
    fireEvent.click(screen.getByRole('button', { name: '등록' }));
    fireEvent.click(screen.getByRole('button', { name: '등록 중...' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      title: '배포 안내',
      version: 'v1.0.0',
      content: '변경 사항',
      published: true,
      items: [{ itemType: 'ETC', summary: '변경 사항', displayOrder: 0 }],
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
    fireEvent.change(screen.getByLabelText('항목 요약 1'), { target: { value: '변경 사항' } });
    fireEvent.click(screen.getByRole('button', { name: '등록' }));

    expect((await screen.findByRole('alert')).textContent).toContain('버전 형식이 올바르지 않습니다.');
  });
});
