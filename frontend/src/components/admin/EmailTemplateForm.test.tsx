import React from 'react';
import '@testing-library/jest-dom/jest-globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ApiResponse, EmailTemplateDetail, EmailTemplatePreview, EmailTemplateTestSend } from '@/types';

type DetailResponse = { data: ApiResponse<EmailTemplateDetail> };
type PreviewResponse = { data: ApiResponse<EmailTemplatePreview> };
type TestSendResponse = { data: ApiResponse<EmailTemplateTestSend> };
const mockGetTemplate = jest.fn<(id: number) => Promise<DetailResponse>>();
const mockPreview = jest.fn<() => Promise<PreviewResponse>>();
const mockTestSend = jest.fn<(id: number) => Promise<TestSendResponse>>();
const mockCreateTemplate = jest.fn<(payload: unknown) => Promise<DetailResponse>>();
const mockUpdateTemplate = jest.fn<(id: number, payload: unknown) => Promise<DetailResponse>>();
const mockInsertText = jest.fn<(text: string) => void>();

jest.mock('@/services/emailTemplateService', () => ({
  emailTemplateService: {
    getTemplate: mockGetTemplate,
    preview: mockPreview,
    testSend: mockTestSend,
    createTemplate: mockCreateTemplate,
    updateTemplate: mockUpdateTemplate,
  },
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: { user: { email: string } }) => unknown) => selector({ user: { email: 'admin@tpmp.com' } }),
}));

jest.mock('@/components/ui/RichTextEditor', () => ({
  RichTextEditor: React.forwardRef(function MockRichTextEditor(
    { value, onChange, disabled, ariaLabelledBy }: { value: string; onChange: (value: string) => void; disabled?: boolean; ariaLabelledBy?: string },
    ref: React.ForwardedRef<{ insertText(text: string): void }>,
  ) {
    React.useImperativeHandle(ref, () => ({ insertText: mockInsertText }));
    return <textarea aria-labelledby={ariaLabelledBy} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />;
  }),
}));

jest.mock('@/components/ui/RichContent', () => ({
  RichContent: ({ html }: { html: string }) => <div data-testid="preview-content">{html.replace(/<[^>]+>/g, '')}</div>,
}));

jest.mock('@/components/ui/Skeleton', () => ({
  Skeleton: () => <div data-testid="form-skeleton" />,
}));

const EmailTemplateForm = require('./EmailTemplateForm').EmailTemplateForm as typeof import('./EmailTemplateForm').EmailTemplateForm;

const detail: EmailTemplateDetail = {
  id: 1,
  name: '완료 템플릿',
  scope: 'INQUIRY_STATUS',
  active: true,
  defaultTemplate: false,
  referenceCount: 1,
  referencedEvents: [{ eventCode: 'INQUIRY_COMPLETED', eventLabel: '처리 완료' }],
  deletable: false,
  subjectTemplate: '{{recipientName}}님 안내',
  htmlBody: '<p>본문</p>',
  textBody: '본문',
  allowedVariables: [{ token: '{{recipientName}}', name: 'recipientName', label: '수신자 이름', description: '수신자 표시 이름' }],
  createdAt: '2026-08-31T09:00:00',
  updatedAt: '2026-08-31T09:00:00',
};

describe('EmailTemplateForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTemplate.mockResolvedValue({ data: { success: true, data: detail, timestamp: '2026-08-31T09:00:00' } });
  });

  it('변수 버튼은 ref insertText를 호출하고 preview는 서버 HTML만 렌더한다', async () => {
    mockPreview.mockResolvedValue({
      data: {
        success: true,
        data: {
          sanitizedHtmlBody: '<p>정화됨</p>',
          renderedSubject: '샘플',
          renderedHtmlBody: '<p>정화됨</p>',
          renderedTextBody: '정화됨',
          unsafeContentRemoved: true,
        },
        timestamp: '2026-08-31T09:00:00',
      },
    });

    render(<EmailTemplateForm mode="create" />);
    fireEvent.click(screen.getByRole('button', { name: '수신자 이름 삽입' }));
    expect(mockInsertText).toHaveBeenCalledWith('{{recipientName}}');
    fireEvent.click(screen.getByRole('button', { name: '미리보기' }));

    expect(await screen.findByText('정화됨')).toBeInTheDocument();
    expect(screen.getByText(/안전하지 않은 HTML이 제거/)).toBeInTheDocument();
    expect(mockPreview).toHaveBeenCalledTimes(1);
  });

  it('테스트 발송 수신자는 로그인 관리자 이메일로 읽기 전용 표시한다', async () => {
    render(<EmailTemplateForm mode="edit" templateId={1} />);

    expect(await screen.findByText('admin@tpmp.com')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: '테스트 수신 이메일' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '테스트 발송' })).toBeEnabled();
  });

  it('편집 조회 중에는 폼 Skeleton을 표시한다', () => {
    mockGetTemplate.mockReturnValue(new Promise(() => undefined));
    render(<EmailTemplateForm mode="edit" templateId={1} />);
    expect(screen.getAllByTestId('form-skeleton')).toHaveLength(3);
  });

  it('저장 성공 시 서버가 정화한 htmlBody를 편집기에 반영한다', async () => {
    const saved = { ...detail, htmlBody: '<p>서버 정화 본문</p>' };
    mockCreateTemplate.mockResolvedValue({ data: { success: true, data: saved, timestamp: '2026-08-31T09:00:00' } });
    render(<EmailTemplateForm mode="create" />);

    fireEvent.change(screen.getByLabelText('템플릿 이름'), { target: { value: '새 템플릿' } });
    fireEvent.change(screen.getByLabelText('제목 템플릿'), { target: { value: '제목' } });
    fireEvent.change(screen.getByLabelText('HTML 본문'), { target: { value: '<p onclick="x">입력</p>' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => expect(screen.getByLabelText('HTML 본문')).toHaveValue('<p>서버 정화 본문</p>'));
  });

  it('미리보기 후 저장하면 정화된 저장 내용으로 서버 preview를 다시 조회한다', async () => {
    const saved = { ...detail, name: '새 템플릿', subjectTemplate: '제목', htmlBody: '<p>저장 정화</p>' };
    mockCreateTemplate.mockResolvedValue({ data: { success: true, data: saved, timestamp: '2026-08-31T09:00:00' } });
    mockPreview
      .mockResolvedValueOnce({ data: { success: true, data: { sanitizedHtmlBody: '<p>초기</p>', renderedSubject: '초기 제목', renderedHtmlBody: '<p>초기 렌더</p>', renderedTextBody: '초기 렌더', unsafeContentRemoved: false }, timestamp: '2026-08-31T09:00:00' } })
      .mockResolvedValueOnce({ data: { success: true, data: { sanitizedHtmlBody: '<p>저장 정화</p>', renderedSubject: '저장 제목', renderedHtmlBody: '<p>저장 후 렌더</p>', renderedTextBody: '저장 후 렌더', unsafeContentRemoved: false }, timestamp: '2026-08-31T09:00:00' } });
    render(<EmailTemplateForm mode="create" />);
    fireEvent.change(screen.getByLabelText('템플릿 이름'), { target: { value: '새 템플릿' } });
    fireEvent.change(screen.getByLabelText('제목 템플릿'), { target: { value: '제목' } });
    fireEvent.change(screen.getByLabelText('HTML 본문'), { target: { value: '<p>입력</p>' } });
    fireEvent.click(screen.getByRole('button', { name: '미리보기' }));
    expect(await screen.findByText('초기 렌더')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('저장 후 렌더')).toBeInTheDocument();
    expect(mockPreview).toHaveBeenCalledTimes(2);
    expect(mockPreview).toHaveBeenLastCalledWith({ scope: 'INQUIRY_STATUS', subjectTemplate: '제목', htmlBody: '<p>저장 정화</p>' });
  });

  it('미리보기 요청 중 입력이 바뀌면 오래된 응답을 표시하지 않는다', async () => {
    let resolvePreview: ((value: PreviewResponse) => void) | undefined;
    mockPreview.mockReturnValue(new Promise((resolve) => { resolvePreview = resolve; }));
    render(<EmailTemplateForm mode="create" />);
    fireEvent.change(screen.getByLabelText('제목 템플릿'), { target: { value: '이전 제목' } });
    fireEvent.change(screen.getByLabelText('HTML 본문'), { target: { value: '<p>이전 본문</p>' } });
    fireEvent.click(screen.getByRole('button', { name: '미리보기' }));

    fireEvent.change(screen.getByLabelText('HTML 본문'), { target: { value: '<p>현재 본문</p>' } });
    resolvePreview?.({ data: { success: true, data: { sanitizedHtmlBody: '<p>이전 본문</p>', renderedSubject: '이전 제목', renderedHtmlBody: '<p>오래된 미리보기</p>', renderedTextBody: '오래된 미리보기', unsafeContentRemoved: false }, timestamp: '2026-08-31T09:00:00' } });

    await waitFor(() => expect(screen.getByRole('button', { name: '미리보기' })).toBeEnabled());
    expect(screen.queryByText('오래된 미리보기')).not.toBeInTheDocument();
    expect(screen.getByLabelText('HTML 본문')).toHaveValue('<p>현재 본문</p>');
  });

  it('미리보기 요청 중에는 저장을 시작할 수 없다', () => {
    mockPreview.mockReturnValue(new Promise(() => undefined));
    render(<EmailTemplateForm mode="create" />);
    fireEvent.click(screen.getByRole('button', { name: '미리보기' }));

    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
  });

  it('저장 응답을 기다리는 동안 폼 입력과 테스트 발송을 잠가 서버 snapshot과의 경합을 막는다', async () => {
    let resolveSave: ((value: DetailResponse) => void) | undefined;
    mockUpdateTemplate.mockReturnValue(new Promise((resolve) => { resolveSave = resolve; }));
    render(<EmailTemplateForm mode="edit" templateId={1} />);

    await screen.findByDisplayValue('완료 템플릿');
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    expect(screen.getByLabelText('템플릿 이름')).toBeDisabled();
    expect(screen.getByLabelText('제목 템플릿')).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: '활성 템플릿' })).toBeDisabled();
    expect(screen.getByLabelText('HTML 본문')).toBeDisabled();
    expect(screen.getByRole('button', { name: '테스트 발송' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '테스트 발송' }));
    expect(mockTestSend).not.toHaveBeenCalled();

    resolveSave?.({ data: { success: true, data: detail, timestamp: '2026-08-31T09:00:00' } });
    await waitFor(() => expect(screen.getByRole('button', { name: '저장' })).toBeEnabled());
  });

  it('HTML 본문 label을 편집기의 접근 가능한 이름으로 연결한다', () => {
    render(<EmailTemplateForm mode="create" />);

    expect(screen.getByRole('textbox', { name: 'HTML 본문' })).toBeInTheDocument();
  });

  it('연결된 템플릿을 비활성화하면 올바른 유지 안내 문구를 표시한다', async () => {
    render(<EmailTemplateForm mode="edit" templateId={1} />);

    await screen.findByDisplayValue('완료 템플릿');
    fireEvent.click(screen.getByRole('checkbox', { name: '활성 템플릿' }));
    expect(screen.getByText('연결은 유지되지만 이 템플릿을 사용하는 이메일 발송은 중지됩니다.')).toBeInTheDocument();
  });
});
