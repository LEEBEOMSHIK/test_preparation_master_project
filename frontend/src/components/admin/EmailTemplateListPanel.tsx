'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ApiApplicationError, extractApiErrorMessage } from '@/lib/apiError';
import { emailTemplateService } from '@/services/emailTemplateService';
import type { EmailTemplateEventCode, EmailTemplateReference, EmailTemplateSummary, PageResponse } from '@/types';

const PAGE_SIZE = 20;
const EVENT_CODES: EmailTemplateEventCode[] = [
  'INQUIRY_ANSWERED', 'INQUIRY_COMPLETED', 'INQUIRY_UNABLE_TO_PROCESS',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function isReference(value: unknown): value is EmailTemplateReference {
  if (!isRecord(value)) return false;
  return typeof value.eventLabel === 'string'
    && typeof value.eventCode === 'string'
    && EVENT_CODES.includes(value.eventCode as EmailTemplateEventCode);
}

function referencedEventsFromError(error: unknown): EmailTemplateReference[] {
  if (!isRecord(error) || !isRecord(error.response) || !isRecord(error.response.data)) return [];
  const apiError = error.response.data.error;
  if (!isRecord(apiError) || !isRecord(apiError.details)) return [];
  const references = apiError.details.referencedEvents;
  return Array.isArray(references) ? references.filter(isReference) : [];
}

export function EmailTemplateListPanel() {
  const requestGeneration = useRef(0);
  const mutationInProgressRef = useRef(false);
  const [pageData, setPageData] = useState<PageResponse<EmailTemplateSummary> | null>(null);
  const [page, setPage] = useState(0);
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);
  const [mutationInProgress, setMutationInProgress] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const beginMutation = (): boolean => {
    if (mutationInProgressRef.current) return false;
    mutationInProgressRef.current = true;
    setMutationInProgress(true);
    setError('');
    setMessage('');
    return true;
  };

  const finishMutation = (): void => {
    mutationInProgressRef.current = false;
    setMutationInProgress(false);
  };

  const loadTemplates = useCallback(async () => {
    const generation = requestGeneration.current + 1;
    requestGeneration.current = generation;
    setLoading(true);
    setError('');
    try {
      const response = await emailTemplateService.getTemplates({
        keyword: keyword || undefined,
        scope: 'INQUIRY_STATUS',
        active: activeFilter === 'all' ? undefined : activeFilter === 'active',
        page,
        size: PAGE_SIZE,
      });
      if (!response.data.success || !response.data.data) {
        throw new ApiApplicationError(response.data.error?.message ?? '템플릿 목록을 불러오지 못했습니다.');
      }
      if (generation === requestGeneration.current) setPageData(response.data.data);
    } catch (requestError: unknown) {
      if (generation === requestGeneration.current) {
        setPageData(null);
        setError(extractApiErrorMessage(requestError, '템플릿 목록을 불러오지 못했습니다.'));
      }
    } finally {
      if (generation === requestGeneration.current) setLoading(false);
    }
  }, [activeFilter, keyword, page]);

  useEffect(() => { void loadTemplates(); }, [loadTemplates]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(0);
    setKeyword(keywordInput.trim());
  };

  const cloneTemplate = async (template: EmailTemplateSummary) => {
    if (!beginMutation()) return;
    try {
      const response = await emailTemplateService.cloneTemplate(template.id);
      if (!response.data.success) throw new ApiApplicationError(response.data.error?.message ?? '복제에 실패했습니다.');
      setMessage(`${template.name} 템플릿을 복제했습니다.`);
      await loadTemplates();
    } catch (requestError: unknown) {
      setError(extractApiErrorMessage(requestError, '템플릿 복제에 실패했습니다.'));
    } finally { finishMutation(); }
  };

  const resetDefault = async (template: EmailTemplateSummary) => {
    if (!window.confirm('기본 템플릿 내용을 초기 상태로 복원하시겠습니까?')) return;
    if (!beginMutation()) return;
    try {
      const response = await emailTemplateService.resetDefault(template.id);
      if (!response.data.success) throw new ApiApplicationError(response.data.error?.message ?? '초기화에 실패했습니다.');
      setMessage(`${template.name} 템플릿을 초기화했습니다.`);
      await loadTemplates();
    } catch (requestError: unknown) {
      setError(extractApiErrorMessage(requestError, '기본 템플릿 초기화에 실패했습니다.'));
    } finally { finishMutation(); }
  };

  const deleteTemplate = async (template: EmailTemplateSummary) => {
    if (!template.deletable || !window.confirm('이 템플릿을 삭제하시겠습니까?')) return;
    if (!beginMutation()) return;
    try {
      const response = await emailTemplateService.deleteTemplate(template.id);
      if (!response.data.success) throw new ApiApplicationError(response.data.error?.message ?? '삭제에 실패했습니다.');
      setMessage(`${template.name} 템플릿을 삭제했습니다.`);
      if ((pageData?.content.length ?? 0) === 1 && page > 0) setPage((current) => current - 1);
      else await loadTemplates();
    } catch (requestError: unknown) {
      const references = referencedEventsFromError(requestError);
      setError(references.length > 0
        ? `${references.map((reference) => reference.eventLabel).join(', ')}에서 사용 중인 템플릿입니다. 연결을 해제한 후 삭제해 주세요.`
        : extractApiErrorMessage(requestError, '템플릿 삭제에 실패했습니다.'));
    } finally { finishMutation(); }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form onSubmit={submitSearch} className="flex flex-1 flex-col gap-2 sm:flex-row">
          <input aria-label="템플릿 검색" value={keywordInput} onChange={(event) => setKeywordInput(event.target.value)} placeholder="템플릿 이름 검색" className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <select aria-label="활성 상태" value={activeFilter} onChange={(event) => { setActiveFilter(event.target.value as typeof activeFilter); setPage(0); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="all">전체 상태</option><option value="active">활성</option><option value="inactive">비활성</option>
          </select>
          <button type="submit" className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white">검색</button>
        </form>
        <Link href="/admin/email-templates/new" className="rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white">새 템플릿</Link>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        {loading ? <TableSkeleton rows={5} cols={7} /> : pageData && pageData.content.length > 0 ? (
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600"><tr><th className="px-4 py-3">이름</th><th className="px-4 py-3">상태</th><th className="px-4 py-3">종류</th><th className="px-4 py-3">연결 이벤트</th><th className="px-4 py-3">수정일</th><th className="px-4 py-3 text-right">관리</th></tr></thead>
            <tbody className="divide-y divide-gray-100">{pageData.content.map((template) => (
              <tr key={template.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{template.name}</td>
                <td className="px-4 py-3">{template.active ? '활성' : '비활성'}</td>
                <td className="px-4 py-3">{template.defaultTemplate ? '기본' : '사용자'}</td>
                <td className="px-4 py-3">{template.referencedEvents.length > 0 ? template.referencedEvents.map((reference) => reference.eventLabel).join(', ') : '연결 없음'}</td>
                <td className="px-4 py-3">{new Date(template.updatedAt).toLocaleString('ko-KR')}</td>
                <td className="px-4 py-3"><div className="flex justify-end gap-2">
                  <Link href={`/admin/email-templates/${template.id}/edit`} className="rounded border border-gray-300 px-2.5 py-1.5">편집</Link>
                  <button type="button" disabled={mutationInProgress} onClick={() => void cloneTemplate(template)} className="rounded border border-gray-300 px-2.5 py-1.5 disabled:opacity-50">복제</button>
                  {template.defaultTemplate && <button type="button" disabled={mutationInProgress} onClick={() => void resetDefault(template)} className="rounded border border-gray-300 px-2.5 py-1.5 disabled:opacity-50">초기화</button>}
                  <button type="button" disabled={!template.deletable || mutationInProgress} title={!template.deletable ? '연결을 해제해야 삭제할 수 있습니다.' : undefined} onClick={() => void deleteTemplate(template)} className="rounded border border-red-200 px-2.5 py-1.5 text-red-600 disabled:cursor-not-allowed disabled:opacity-40">삭제</button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        ) : <div className="px-6 py-14 text-center text-sm text-gray-500">등록된 이메일 템플릿이 없습니다.</div>}
      </div>
      <Pagination page={page} totalPages={pageData?.totalPages ?? 0} onChange={setPage} />
    </section>
  );
}
