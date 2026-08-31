'use client';

import { useParams } from 'next/navigation';
import { EmailTemplateForm } from '@/components/admin/EmailTemplateForm';

export default function EditEmailTemplatePage() {
  const params = useParams<{ id: string }>();
  const templateId = Number(params.id);
  if (!Number.isSafeInteger(templateId) || templateId <= 0) return <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">유효하지 않은 이메일 템플릿 ID입니다.</p>;
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-gray-900">이메일 템플릿 편집</h1><p className="mt-1 text-sm text-gray-500">저장 시 서버가 HTML을 정화하고 텍스트 본문을 다시 생성합니다.</p></div><EmailTemplateForm mode="edit" templateId={templateId} /></div>;
}
