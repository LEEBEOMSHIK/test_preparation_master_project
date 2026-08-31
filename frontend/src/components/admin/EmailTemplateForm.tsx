'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { RichContent } from '@/components/ui/RichContent';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Skeleton } from '@/components/ui/Skeleton';
import { ApiApplicationError, extractApiErrorMessage } from '@/lib/apiError';
import { emailTemplateService } from '@/services/emailTemplateService';
import { useAuthStore } from '@/store/authStore';
import type {
  EmailTemplateDetail,
  EmailTemplateFormProps,
  EmailTemplatePayload,
  EmailTemplatePreview,
  EmailTemplateVariable,
  RichTextEditorHandle,
} from '@/types';

const CREATE_VARIABLES: EmailTemplateVariable[] = [
  { token: '{{recipientName}}', name: 'recipientName', label: '수신자 이름', description: '문의자 표시 이름' },
  { token: '{{inquiryId}}', name: 'inquiryId', label: '문의 번호', description: '문의 식별자' },
  { token: '{{inquiryTitle}}', name: 'inquiryTitle', label: '문의 제목', description: '문의 제목' },
  { token: '{{inquiryType}}', name: 'inquiryType', label: '접수 유형', description: '접수 유형 표시명' },
  { token: '{{statusLabel}}', name: 'statusLabel', label: '처리 상태', description: '변경 상태 표시명' },
  { token: '{{inquiryDetailUrl}}', name: 'inquiryDetailUrl', label: '문의 상세 URL', description: '사용자 문의 상세 URL' },
  { token: '{{serviceName}}', name: 'serviceName', label: '서비스 이름', description: '서비스 이름 TPMP' },
];

export function EmailTemplateForm({ mode, templateId }: EmailTemplateFormProps) {
  const editorRef = useRef<RichTextEditorHandle>(null);
  const adminEmail = useAuthStore((state) => state.user?.email ?? '');
  const [template, setTemplate] = useState<EmailTemplateDetail | null>(null);
  const [name, setName] = useState('');
  const [subjectTemplate, setSubjectTemplate] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [active, setActive] = useState(true);
  const [allowedVariables, setAllowedVariables] = useState<EmailTemplateVariable[]>(CREATE_VARIABLES);
  const [preview, setPreview] = useState<EmailTemplatePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (mode === 'create') { setLoading(false); return; }
    if (!templateId) { setError('유효한 템플릿 ID가 필요합니다.'); setLoading(false); return; }
    let mounted = true;
    const loadTemplate = async () => {
      setLoading(true);
      try {
        const response = await emailTemplateService.getTemplate(templateId);
        if (!response.data.success || !response.data.data) {
          throw new ApiApplicationError(response.data.error?.message ?? '템플릿을 불러오지 못했습니다.');
        }
        if (!mounted) return;
        const detail = response.data.data;
        setTemplate(detail); setName(detail.name); setSubjectTemplate(detail.subjectTemplate);
        setHtmlBody(detail.htmlBody); setActive(detail.active); setAllowedVariables(detail.allowedVariables);
      } catch (requestError: unknown) {
        if (mounted) setError(extractApiErrorMessage(requestError, '템플릿을 불러오지 못했습니다.'));
      } finally { if (mounted) setLoading(false); }
    };
    void loadTemplate();
    return () => { mounted = false; };
  }, [mode, templateId]);

  const payload = (): EmailTemplatePayload => ({
    name: name.trim(), scope: 'INQUIRY_STATUS', subjectTemplate: subjectTemplate.trim(), htmlBody, active,
  });

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError(''); setMessage('');
    const request = payload();
    if (!request.name || !request.subjectTemplate || !request.htmlBody.trim()) {
      setError('템플릿 이름, 제목 템플릿, HTML 본문을 모두 입력해 주세요.');
      return;
    }
    setSaving(true);
    try {
      const response = mode === 'edit' && templateId
        ? await emailTemplateService.updateTemplate(templateId, request)
        : await emailTemplateService.createTemplate(request);
      if (!response.data.success || !response.data.data) {
        throw new ApiApplicationError(response.data.error?.message ?? '템플릿 저장에 실패했습니다.');
      }
      const saved = response.data.data;
      setTemplate(saved); setName(saved.name); setSubjectTemplate(saved.subjectTemplate);
      setHtmlBody(saved.htmlBody); setActive(saved.active); setAllowedVariables(saved.allowedVariables);
      if (preview) {
        try {
          const previewResponse = await emailTemplateService.preview({
            scope: saved.scope,
            subjectTemplate: saved.subjectTemplate,
            htmlBody: saved.htmlBody,
          });
          setPreview(previewResponse.data.success && previewResponse.data.data ? previewResponse.data.data : null);
        } catch {
          setPreview(null);
          setError('템플릿은 저장됐지만 미리보기를 갱신하지 못했습니다. 미리보기를 다시 실행해 주세요.');
        }
      }
      setMessage('이메일 템플릿을 저장했습니다.');
    } catch (requestError: unknown) {
      setError(extractApiErrorMessage(requestError, '템플릿 저장에 실패했습니다.'));
    } finally { setSaving(false); }
  };

  const showPreview = async () => {
    setError(''); setMessage('');
    setPreviewing(true);
    try {
      const response = await emailTemplateService.preview({ scope: 'INQUIRY_STATUS', subjectTemplate: subjectTemplate.trim(), htmlBody });
      if (!response.data.success || !response.data.data) throw new ApiApplicationError(response.data.error?.message ?? '미리보기에 실패했습니다.');
      setPreview(response.data.data);
    } catch (requestError: unknown) {
      setError(extractApiErrorMessage(requestError, '이메일 미리보기에 실패했습니다.'));
    } finally { setPreviewing(false); }
  };

  const testSend = async () => {
    if (mode !== 'edit' || !templateId) return;
    setSending(true); setError(''); setMessage('');
    try {
      const response = await emailTemplateService.testSend(templateId);
      if (!response.data.success || !response.data.data) throw new ApiApplicationError(response.data.error?.message ?? '테스트 발송에 실패했습니다.');
      setMessage(`테스트 이메일을 ${response.data.data.recipientMasked} 주소로 발송했습니다.`);
    } catch (requestError: unknown) {
      setError(extractApiErrorMessage(requestError, '테스트 이메일 발송에 실패했습니다.'));
    } finally { setSending(false); }
  };

  if (loading) return <div className="space-y-4" aria-label="이메일 템플릿 폼 불러오는 중"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-10 w-full" /><Skeleton className="h-72 w-full" /></div>;

  return (
    <form onSubmit={save} className="space-y-6">
      {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
      <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-gray-700"><span>템플릿 이름</span><input aria-label="템플릿 이름" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" /></label>
        <label className="space-y-1 text-sm font-medium text-gray-700"><span>범위</span><input aria-label="템플릿 범위" value="문의 상태 변경" readOnly className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-normal text-gray-500" /></label>
        <label className="space-y-1 text-sm font-medium text-gray-700 sm:col-span-2"><span>제목 템플릿</span><input aria-label="제목 템플릿" maxLength={200} value={subjectTemplate} onChange={(event) => setSubjectTemplate(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" /></label>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 sm:col-span-2"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />활성 템플릿</label>
        {!active && (template?.referenceCount ?? 0) > 0 && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 sm:col-span-2">연결은 유지되지만 이 템플릿을 사용하는 이메일 발송은 중지됩니다.</p>}
      </div>
      <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-5">
        <div><h2 className="font-semibold text-gray-900">사용 가능한 변수</h2><p className="text-xs text-gray-500">버튼을 누르면 본문 에디터의 현재 커서에 삽입됩니다.</p></div>
        <div className="flex flex-wrap gap-2">{allowedVariables.map((variable) => <button key={variable.name} type="button" title={variable.description} aria-label={`${variable.label} 삽입`} onClick={() => editorRef.current?.insertText(variable.token)} className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">{variable.label} <code>{variable.token}</code></button>)}</div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">HTML 본문</label><RichTextEditor ref={editorRef} value={htmlBody} onChange={setHtmlBody} minHeight={300} allowImages={false} /></div>
      </section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2"><button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? '저장 중...' : '저장'}</button><button type="button" disabled={previewing} onClick={() => void showPreview()} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-50">{previewing ? '미리보기 생성 중...' : '미리보기'}</button><Link href="/admin/email-templates" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium">목록</Link></div>
        {mode === 'edit' && <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm"><span className="text-gray-500">테스트 수신자</span><strong>{adminEmail || '관리자 이메일 확인 불가'}</strong><button type="button" disabled={sending || !templateId || !adminEmail} onClick={() => void testSend()} className="rounded bg-gray-800 px-3 py-1.5 text-white disabled:opacity-40">{sending ? '발송 중...' : '테스트 발송'}</button></div>}
      </div>
      {preview && <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-5"><div className="flex items-center justify-between"><h2 className="font-semibold text-gray-900">서버 미리보기</h2>{preview.unsafeContentRemoved && <span className="text-xs font-medium text-amber-700">안전하지 않은 HTML이 제거되었습니다.</span>}</div><div className="rounded-lg bg-gray-50 px-4 py-3"><span className="text-xs text-gray-500">제목</span><p className="font-medium">{preview.renderedSubject}</p></div><div className="rounded-lg border border-gray-200 p-4"><RichContent html={preview.renderedHtmlBody} /></div><pre aria-label="텍스트 본문 미리보기" className="whitespace-pre-wrap rounded-lg bg-gray-900 p-4 text-xs text-gray-100">텍스트 본문{`\n${preview.renderedTextBody}`}</pre></section>}
    </form>
  );
}
