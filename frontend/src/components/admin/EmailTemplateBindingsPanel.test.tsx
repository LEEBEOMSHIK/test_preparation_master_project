import React from 'react';
import '@testing-library/jest-dom/jest-globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ApiResponse, EmailTemplateBinding, EmailTemplateSummary, PageResponse } from '@/types';

type BindingsResponse = { data: ApiResponse<EmailTemplateBinding[]> };
type BindingResponse = { data: ApiResponse<EmailTemplateBinding> };
type TemplatesResponse = { data: ApiResponse<PageResponse<EmailTemplateSummary>> };
const mockGetBindings = jest.fn<() => Promise<BindingsResponse>>();
const mockGetTemplates = jest.fn<(params?: { page?: number }) => Promise<TemplatesResponse>>();
const mockUnbind = jest.fn<(eventCode: string) => Promise<BindingResponse>>();
const mockBind = jest.fn<(eventCode: string, templateId: number) => Promise<BindingResponse>>();

jest.mock('@/services/emailTemplateService', () => ({
  emailTemplateService: {
    getBindings: mockGetBindings,
    getTemplates: mockGetTemplates,
    unbind: mockUnbind,
    bind: mockBind,
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

  it('현재 비활성 연결은 다시 저장할 수 없고 활성 템플릿으로만 교체할 수 있다', async () => {
    mockGetBindings.mockResolvedValue({ data: { success: true, data: [inactiveBinding], timestamp: '2026-08-31T09:00:00' } });
    mockGetTemplates.mockResolvedValue({ data: { success: true, timestamp: '2026-08-31T09:00:00', data: { content: [{ id: 2, name: '활성 대체 템플릿', scope: 'INQUIRY_STATUS', active: true, defaultTemplate: false, referenceCount: 0, referencedEvents: [], deletable: true, updatedAt: '2026-08-31T09:00:00' }], totalElements: 1, totalPages: 1, page: 0, size: 100 } } });
    render(<EmailTemplateBindingsPanel />);

    const select = await screen.findByRole('combobox', { name: '처리 완료 템플릿' });
    expect(screen.getByRole('option', { name: '완료 템플릿' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '연결 저장' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '연결 해제' })).toBeEnabled();

    fireEvent.change(select, { target: { value: '2' } });
    expect(screen.getByRole('button', { name: '연결 저장' })).toBeEnabled();
  });

  it('활성 템플릿 후보의 모든 페이지를 조회해 101번째 후보도 표시한다', async () => {
    mockGetBindings.mockResolvedValue({ data: { success: true, data: [{ ...inactiveBinding, templateId: null, templateName: null, templateActive: null, configured: false }], timestamp: '2026-08-31T09:00:00' } });
    const firstPage = Array.from({ length: 100 }, (_, index) => ({ id: index + 1, name: `${index + 1}번째 템플릿`, scope: 'INQUIRY_STATUS' as const, active: true, defaultTemplate: false, referenceCount: 0, referencedEvents: [], deletable: true, updatedAt: '2026-08-31T09:00:00' }));
    mockGetTemplates.mockImplementation(async (params) => ({ data: { success: true, timestamp: '2026-08-31T09:00:00', data: { content: params?.page === 1 ? [{ ...firstPage[0], id: 101, name: '101번째 템플릿' }] : firstPage, totalElements: 101, totalPages: 2, page: params?.page ?? 0, size: 100 } } }));

    render(<EmailTemplateBindingsPanel />);

    expect(await screen.findByRole('option', { name: '101번째 템플릿' })).toBeInTheDocument();
    expect(mockGetTemplates).toHaveBeenCalledWith(expect.objectContaining({ page: 1, size: 100 }));
  });

  it('한 이벤트의 연결 해제를 기다리는 동안 다른 이벤트의 bind와 unbind도 차단한다', async () => {
    let resolveUnbind: ((value: BindingResponse) => void) | undefined;
    const answeredBinding: EmailTemplateBinding = {
      ...inactiveBinding,
      eventCode: 'INQUIRY_ANSWERED',
      eventLabel: '답변 완료',
      templateId: 2,
      templateName: '답변 템플릿',
      templateActive: true,
      sendable: true,
      unavailableReason: null,
    };
    const completedBinding: EmailTemplateBinding = {
      ...inactiveBinding,
      templateActive: true,
      sendable: true,
      unavailableReason: null,
    };
    mockGetBindings.mockResolvedValue({ data: { success: true, data: [answeredBinding, completedBinding], timestamp: '2026-08-31T09:00:00' } });
    mockGetTemplates.mockResolvedValue({
      data: {
        success: true,
        timestamp: '2026-08-31T09:00:00',
        data: {
          content: [
            { id: 1, name: '완료 템플릿', scope: 'INQUIRY_STATUS', active: true, defaultTemplate: false, referenceCount: 1, referencedEvents: [], deletable: false, updatedAt: '2026-08-31T09:00:00' },
            { id: 2, name: '답변 템플릿', scope: 'INQUIRY_STATUS', active: true, defaultTemplate: false, referenceCount: 1, referencedEvents: [], deletable: false, updatedAt: '2026-08-31T09:00:00' },
          ],
          totalElements: 2,
          totalPages: 1,
          page: 0,
          size: 100,
        },
      },
    });
    mockUnbind.mockReturnValue(new Promise((resolve) => { resolveUnbind = resolve; }));
    render(<EmailTemplateBindingsPanel />);

    const unbindButtons = await screen.findAllByRole('button', { name: '연결 해제' });
    fireEvent.click(unbindButtons[0]);

    expect(screen.getAllByRole('button', { name: /연결 저장|연결 해제/ }).every((button) => button.hasAttribute('disabled'))).toBe(true);
    fireEvent.click(screen.getAllByRole('button', { name: '연결 저장' })[1]);
    expect(mockBind).not.toHaveBeenCalled();

    resolveUnbind?.({ data: { success: true, data: { ...answeredBinding, templateId: null, templateName: null, templateActive: null, configured: false, sendable: false }, timestamp: '2026-08-31T09:00:00' } });
    await waitFor(() => expect(screen.getByText('이메일 이벤트 연결을 해제했습니다.')).toBeInTheDocument());
  });
});
