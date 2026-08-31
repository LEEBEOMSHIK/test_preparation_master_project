import React from 'react';
import '@testing-library/jest-dom/jest-globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ApiResponse, EmailTemplateBinding, EmailTemplateSummary, PageResponse } from '@/types';

type BindingsResponse = { data: ApiResponse<EmailTemplateBinding[]> };
type BindingResponse = { data: ApiResponse<EmailTemplateBinding> };
type TemplatesResponse = { data: ApiResponse<PageResponse<EmailTemplateSummary>> };
const mockGetBindings = jest.fn<() => Promise<BindingsResponse>>();
const mockGetTemplates = jest.fn<() => Promise<TemplatesResponse>>();
const mockUnbind = jest.fn<(eventCode: string) => Promise<BindingResponse>>();

jest.mock('@/services/emailTemplateService', () => ({
  emailTemplateService: {
    getBindings: mockGetBindings,
    getTemplates: mockGetTemplates,
    unbind: mockUnbind,
    bind: jest.fn(),
  },
}));

jest.mock('@/components/ui/Skeleton', () => ({
  TableSkeleton: () => <div data-testid="table-skeleton" />,
}));

const EmailTemplateBindingsPanel = require('./EmailTemplateBindingsPanel').EmailTemplateBindingsPanel as typeof import('./EmailTemplateBindingsPanel').EmailTemplateBindingsPanel;

const inactiveBinding: EmailTemplateBinding = {
  eventCode: 'INQUIRY_COMPLETED',
  eventLabel: '처리 완료',
  scope: 'INQUIRY_STATUS',
  templateId: 1,
  templateName: '완료 템플릿',
  templateActive: false,
  configured: true,
  sendable: false,
  unavailableReason: '연결된 템플릿이 비활성 상태입니다.',
};

describe('EmailTemplateBindingsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    mockGetTemplates.mockResolvedValue({
      data: {
        success: true,
        timestamp: '2026-08-31T09:00:00',
        data: { content: [], totalElements: 0, totalPages: 0, page: 0, size: 100 },
      },
    });
  });

  it('비활성 연결은 값은 유지하고 발송 중지됨을 표시한다', async () => {
    mockGetBindings.mockResolvedValue({ data: { success: true, data: [inactiveBinding], timestamp: '2026-08-31T09:00:00' } });

    render(<EmailTemplateBindingsPanel />);

    expect(await screen.findByText('완료 템플릿')).toBeInTheDocument();
    expect(screen.getByText('이메일 발송 중지됨')).toBeInTheDocument();
  });

  it('연결 해제 후 서버가 반환한 미설정 상태를 유지한다', async () => {
    mockGetBindings.mockResolvedValue({ data: { success: true, data: [inactiveBinding], timestamp: '2026-08-31T09:00:00' } });
    const unbound = { ...inactiveBinding, templateId: null, templateName: null, templateActive: null, configured: false, unavailableReason: '연결된 템플릿이 없습니다.' };
    mockUnbind.mockResolvedValue({ data: { success: true, data: unbound, timestamp: '2026-08-31T09:00:00' } });

    render(<EmailTemplateBindingsPanel />);
    fireEvent.click(await screen.findByRole('button', { name: '연결 해제' }));

    await waitFor(() => expect(mockUnbind).toHaveBeenCalledWith('INQUIRY_COMPLETED'));
    expect(await screen.findByText('연결된 템플릿이 없습니다.')).toBeInTheDocument();
  });
});
