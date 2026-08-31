'use client';

import { useCallback, useEffect, useState } from 'react';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ApiApplicationError, extractApiErrorMessage } from '@/lib/apiError';
import { emailTemplateService } from '@/services/emailTemplateService';
import type { EmailTemplateBinding, EmailTemplateEventCode, EmailTemplateSummary } from '@/types';

export function EmailTemplateBindingsPanel() {
  const [bindings, setBindings] = useState<EmailTemplateBinding[]>([]);
  const [templates, setTemplates] = useState<EmailTemplateSummary[]>([]);
  const [selection, setSelection] = useState<Partial<Record<EmailTemplateEventCode, string>>>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<EmailTemplateEventCode | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [bindingsResponse, templatesResponse] = await Promise.all([
        emailTemplateService.getBindings(),
        emailTemplateService.getTemplates({ scope: 'INQUIRY_STATUS', active: true, page: 0, size: 100 }),
      ]);
      if (!bindingsResponse.data.success || !bindingsResponse.data.data) {
        throw new ApiApplicationError(bindingsResponse.data.error?.message ?? '연결 정보를 불러오지 못했습니다.');
      }
      if (!templatesResponse.data.success || !templatesResponse.data.data) {
        throw new ApiApplicationError(templatesResponse.data.error?.message ?? '템플릿 목록을 불러오지 못했습니다.');
      }
      const loadedBindings = bindingsResponse.data.data;
      setBindings(loadedBindings);
      setTemplates(templatesResponse.data.data.content);
      setSelection(Object.fromEntries(loadedBindings.map((binding) => [binding.eventCode, binding.templateId?.toString() ?? ''])));
    } catch (requestError: unknown) {
      setBindings([]);
      setTemplates([]);
      setError(extractApiErrorMessage(requestError, '이메일 이벤트 연결 정보를 불러오지 못했습니다.'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const replaceBinding = (updated: EmailTemplateBinding) => {
    setBindings((current) => current.map((binding) => binding.eventCode === updated.eventCode ? updated : binding));
    setSelection((current) => ({ ...current, [updated.eventCode]: updated.templateId?.toString() ?? '' }));
  };

  const bind = async (eventCode: EmailTemplateEventCode) => {
    const templateId = Number(selection[eventCode]);
    if (!Number.isSafeInteger(templateId) || templateId <= 0) {
      setError('연결할 활성 템플릿을 선택해 주세요.');
      return;
    }
    setProcessing(eventCode); setError(''); setMessage('');
    try {
      const response = await emailTemplateService.bind(eventCode, templateId);
      if (!response.data.success || !response.data.data) throw new ApiApplicationError(response.data.error?.message ?? '연결에 실패했습니다.');
      replaceBinding(response.data.data);
      setMessage('이메일 이벤트 연결을 저장했습니다.');
    } catch (requestError: unknown) {
      setError(extractApiErrorMessage(requestError, '이메일 이벤트 연결에 실패했습니다.'));
    } finally { setProcessing(null); }
  };

  const unbind = async (eventCode: EmailTemplateEventCode) => {
    if (!window.confirm('이 이벤트의 이메일 템플릿 연결을 해제하시겠습니까?')) return;
    setProcessing(eventCode); setError(''); setMessage('');
    try {
      const response = await emailTemplateService.unbind(eventCode);
      if (!response.data.success || !response.data.data) throw new ApiApplicationError(response.data.error?.message ?? '연결 해제에 실패했습니다.');
      replaceBinding(response.data.data);
      setMessage('이메일 이벤트 연결을 해제했습니다.');
    } catch (requestError: unknown) {
      setError(extractApiErrorMessage(requestError, '이메일 이벤트 연결 해제에 실패했습니다.'));
    } finally { setProcessing(null); }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">연결이 없거나 비활성 템플릿에 연결된 이벤트는 이메일을 발송하지 않습니다.</div>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        {loading ? <TableSkeleton rows={3} cols={5} /> : bindings.length > 0 ? (
          <table className="min-w-[760px] w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600"><tr><th className="px-4 py-3">이벤트</th><th className="px-4 py-3">연결 템플릿</th><th className="px-4 py-3">발송 상태</th><th className="px-4 py-3 text-right">관리</th></tr></thead>
            <tbody className="divide-y divide-gray-100">{bindings.map((binding) => {
              const inactiveCurrentMissing = binding.configured && binding.templateActive === false
                && !templates.some((template) => template.id === binding.templateId);
              return (
                <tr key={binding.eventCode}>
                  <td className="px-4 py-3 font-medium text-gray-900">{binding.eventLabel}</td>
                  <td className="px-4 py-3"><select aria-label={`${binding.eventLabel} 템플릿`} value={selection[binding.eventCode] ?? ''} onChange={(event) => setSelection((current) => ({ ...current, [binding.eventCode]: event.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2">
                    <option value="">연결 안 함</option>
                    {inactiveCurrentMissing && <option value={binding.templateId ?? undefined}>{binding.templateName}</option>}
                    {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
                  </select></td>
                  <td className="px-4 py-3">
                    {binding.sendable ? <span className="text-emerald-700">발송 가능</span>
                      : binding.configured && binding.templateActive === false ? <span className="font-medium text-red-700">이메일 발송 중지됨</span>
                        : <span className="text-gray-500">{binding.unavailableReason ?? '연결된 템플릿이 없습니다.'}</span>}
                  </td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-2">
                    <button type="button" disabled={processing === binding.eventCode || !selection[binding.eventCode]} onClick={() => void bind(binding.eventCode)} className="rounded bg-indigo-600 px-3 py-1.5 text-white disabled:opacity-40">연결 저장</button>
                    <button type="button" disabled={processing === binding.eventCode || !binding.configured} onClick={() => void unbind(binding.eventCode)} className="rounded border border-gray-300 px-3 py-1.5 disabled:opacity-40">연결 해제</button>
                  </div></td>
                </tr>
              );
            })}</tbody>
          </table>
        ) : <div className="px-6 py-14 text-center text-sm text-gray-500">관리할 이메일 이벤트가 없습니다.</div>}
      </div>
    </section>
  );
}
