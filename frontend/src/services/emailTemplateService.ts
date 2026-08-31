import apiClient from './apiClient';
import type {
  ApiResponse,
  EmailTemplateBinding,
  EmailTemplateDetail,
  EmailTemplateEventCode,
  EmailTemplatePayload,
  EmailTemplatePreview,
  EmailTemplateScope,
  EmailTemplateSummary,
  EmailTemplateTestSend,
  PageResponse,
} from '@/types';

export const emailTemplateService = {
  getTemplates: (params: {
    keyword?: string;
    scope?: EmailTemplateScope;
    active?: boolean;
    page: number;
    size: number;
  }) => apiClient.get<ApiResponse<PageResponse<EmailTemplateSummary>>>('/admin/email-templates', { params }),
  getTemplate: (id: number) =>
    apiClient.get<ApiResponse<EmailTemplateDetail>>(`/admin/email-templates/${id}`),
  createTemplate: (payload: EmailTemplatePayload) =>
    apiClient.post<ApiResponse<EmailTemplateDetail>>('/admin/email-templates', payload),
  updateTemplate: (id: number, payload: EmailTemplatePayload) =>
    apiClient.put<ApiResponse<EmailTemplateDetail>>(`/admin/email-templates/${id}`, payload),
  cloneTemplate: (id: number) =>
    apiClient.post<ApiResponse<EmailTemplateDetail>>(`/admin/email-templates/${id}/clone`),
  resetDefault: (id: number) =>
    apiClient.post<ApiResponse<EmailTemplateDetail>>(`/admin/email-templates/${id}/reset-default`),
  deleteTemplate: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/admin/email-templates/${id}`),
  preview: (payload: Pick<EmailTemplatePayload, 'scope' | 'subjectTemplate' | 'htmlBody'>) =>
    apiClient.post<ApiResponse<EmailTemplatePreview>>('/admin/email-templates/preview', payload),
  testSend: (id: number) =>
    apiClient.post<ApiResponse<EmailTemplateTestSend>>(`/admin/email-templates/${id}/test-send`),
  getBindings: () =>
    apiClient.get<ApiResponse<EmailTemplateBinding[]>>('/admin/email-template-bindings'),
  bind: (eventCode: EmailTemplateEventCode, templateId: number) =>
    apiClient.put<ApiResponse<EmailTemplateBinding>>(`/admin/email-template-bindings/${eventCode}`, { templateId }),
  unbind: (eventCode: EmailTemplateEventCode) =>
    apiClient.delete<ApiResponse<EmailTemplateBinding>>(`/admin/email-template-bindings/${eventCode}`),
};
