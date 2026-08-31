import React from 'react';
import '@testing-library/jest-dom/jest-globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ApiResponse, EmailTemplateDetail, EmailTemplateSummary, PageResponse } from '@/types';

type TemplatesResponse = { data: ApiResponse<PageResponse<EmailTemplateSummary>> };
type DetailResponse = { data: ApiResponse<EmailTemplateDetail> };
type VoidResponse = { data: ApiResponse<void> };
const mockGetTemplates = jest.fn<(params?: unknown) => Promise<TemplatesResponse>>();
const mockDelete = jest.fn<(id: number) => Promise<VoidResponse>>();
const mockClone = jest.fn<(id: number) => Promise<DetailResponse>>();

jest.mock('@/services/emailTemplateService', () => ({
  emailTemplateService: {
    getTemplates: mockGetTemplates,
    deleteTemplate: mockDelete,
    cloneTemplate: mockClone,
  },
}));

jest.mock('@/components/ui/Skeleton', () => ({
  TableSkeleton: () => <div data-testid="table-skeleton" />,
}));

const EmailTemplateListPanel = require('./EmailTemplateListPanel').EmailTemplateListPanel as typeof import('./EmailTemplateListPanel').EmailTemplateListPanel;

function summary(overrides: Partial<EmailTemplateSummary> = {}): EmailTemplateSummary {
  return {
    id: 1,
    name: '완료 템플릿',
    scope: 'INQUIRY_STATUS',
    active: true,
    defaultTemplate: false,
    referenceCount: 1,
    referencedEvents: [{ eventCode: 'INQUIRY_COMPLETED', eventLabel: '처리 완료' }],
    deletable: false,
    updatedAt: '2026-08-31T09:00:00',
    ...overrides,
  };
}

function pageOf(content: EmailTemplateSummary[]): TemplatesResponse {
  return {
    data: {
      success: true,
      timestamp: '2026-08-31T09:00:00',
      data: { content, totalElements: content.length, totalPages: 1, page: 0, size: 20 },
    },
  };
}

const clonedDetail: EmailTemplateDetail = {
  ...summary({ id: 3, name: '복제 템플릿', referenceCount: 0, referencedEvents: [], deletable: true }),
  subjectTemplate: '복제 제목',
  htmlBody: '<p>복제 본문</p>',
  textBody: '복제 본문',
  allowedVariables: [],
  createdAt: '2026-08-31T09:00:00',
};

describe('EmailTemplateListPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('목록 로딩 중 TableSkeleton을 표시하고 연결된 템플릿 삭제를 막는다', async () => {
    let resolveRequest: ((value: TemplatesResponse) => void) | undefined;
    mockGetTemplates.mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }));

    render(<EmailTemplateListPanel />);

    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
    resolveRequest?.(pageOf([summary()]));
    expect(await screen.findByText('처리 완료')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '삭제' })).toBeDisabled();
  });

  it('삭제 409 details의 참조 이벤트를 표시한다', async () => {
    mockGetTemplates.mockResolvedValue(pageOf([summary({ deletable: true, referenceCount: 0, referencedEvents: [] })]));
    mockDelete.mockRejectedValue({
      response: {
        status: 409,
        data: {
          success: false,
          error: {
            code: 'EMAIL_TEMPLATE_IN_USE',
            message: '사용 중인 이메일 템플릿입니다.',
            details: { referencedEvents: [{ eventCode: 'INQUIRY_COMPLETED', eventLabel: '처리 완료' }] },
          },
          timestamp: '2026-08-31T09:00:00',
        },
      },
    });

    render(<EmailTemplateListPanel />);
    fireEvent.click(await screen.findByRole('button', { name: '삭제' }));

    expect(await screen.findByText(/처리 완료에서 사용 중/)).toBeInTheDocument();
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith(1));
  });

  it('이전 필터 요청이 늦게 끝나도 최신 목록을 덮어쓰지 않는다', async () => {
    let resolveActive: ((value: TemplatesResponse) => void) | undefined;
    let resolveInactive: ((value: TemplatesResponse) => void) | undefined;
    mockGetTemplates
      .mockResolvedValueOnce(pageOf([summary({ id: 10, name: '초기 템플릿' })]))
      .mockReturnValueOnce(new Promise((resolve) => { resolveActive = resolve; }))
      .mockReturnValueOnce(new Promise((resolve) => { resolveInactive = resolve; }));
    render(<EmailTemplateListPanel />);
    expect(await screen.findByText('초기 템플릿')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('활성 상태'), { target: { value: 'active' } });
    await waitFor(() => expect(mockGetTemplates).toHaveBeenCalledTimes(2));
    fireEvent.change(screen.getByLabelText('활성 상태'), { target: { value: 'inactive' } });
    await waitFor(() => expect(mockGetTemplates).toHaveBeenCalledTimes(3));

    resolveInactive?.(pageOf([summary({ id: 30, name: '최신 비활성 템플릿' })]));
    expect(await screen.findByText('최신 비활성 템플릿')).toBeInTheDocument();
    resolveActive?.(pageOf([summary({ id: 20, name: '오래된 활성 템플릿' })]));
    await waitFor(() => expect(screen.queryByText('오래된 활성 템플릿')).not.toBeInTheDocument());
    expect(screen.getByText('최신 비활성 템플릿')).toBeInTheDocument();
  });

  it('한 행의 복제 응답을 기다리는 동안 다른 행의 mutation도 차단한다', async () => {
    let resolveClone: ((value: DetailResponse) => void) | undefined;
    mockGetTemplates
      .mockResolvedValueOnce(pageOf([
        summary({ id: 1, name: '첫 번째 템플릿', referenceCount: 0, referencedEvents: [], deletable: true }),
        summary({ id: 2, name: '두 번째 템플릿', referenceCount: 0, referencedEvents: [], deletable: true }),
      ]))
      .mockResolvedValue(pageOf([]));
    mockClone.mockReturnValue(new Promise((resolve) => { resolveClone = resolve; }));
    render(<EmailTemplateListPanel />);

    const cloneButtons = await screen.findAllByRole('button', { name: '복제' });
    fireEvent.click(cloneButtons[0]);

    expect(cloneButtons[0]).toBeDisabled();
    expect(cloneButtons[1]).toBeDisabled();
    expect(screen.getAllByRole('button', { name: '삭제' }).every((button) => button.hasAttribute('disabled'))).toBe(true);
    fireEvent.click(cloneButtons[1]);
    expect(mockClone).toHaveBeenCalledTimes(1);

    resolveClone?.({ data: { success: true, data: clonedDetail, timestamp: '2026-08-31T09:00:00' } });
    await waitFor(() => expect(mockGetTemplates).toHaveBeenCalledTimes(2));
  });
});
