import React from 'react';
import '@testing-library/jest-dom/jest-globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ApiResponse, EmailTemplateDetail, EmailTemplateSummary, PageResponse } from '@/types';

type TemplatesResponse = { data: ApiResponse<PageResponse<EmailTemplateSummary>> };
type DetailResponse = { data: ApiResponse<EmailTemplateDetail> };
type VoidResponse = { data: ApiResponse<void> };
const mockGetTemplates = jest.fn<() => Promise<TemplatesResponse>>();
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
});
