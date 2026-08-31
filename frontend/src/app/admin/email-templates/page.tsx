'use client';

import { useRouter } from 'next/navigation';
import { EmailTemplateBindingsPanel } from '@/components/admin/EmailTemplateBindingsPanel';
import { EmailTemplateListPanel } from '@/components/admin/EmailTemplateListPanel';

interface EmailTemplatesPageProps {
  searchParams?: { tab?: string | string[] };
}

export default function EmailTemplatesPage({ searchParams = {} }: EmailTemplatesPageProps) {
  const router = useRouter();
  const activeTab = searchParams.tab === 'bindings' ? 'bindings' : 'templates';
  const moveTab = (tab: 'templates' | 'bindings') => {
    router.push(tab === 'bindings' ? '/admin/email-templates?tab=bindings' : '/admin/email-templates');
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">이메일 템플릿 관리</h1><p className="mt-1 text-sm text-gray-500">문의 상태 이메일의 내용과 이벤트 연결을 관리합니다.</p></div>
      <div className="flex gap-1 border-b border-gray-200" role="tablist" aria-label="이메일 템플릿 관리 탭">
        <button type="button" role="tab" aria-selected={activeTab === 'templates'} onClick={() => moveTab('templates')} className={`border-b-2 px-4 py-3 text-sm font-semibold ${activeTab === 'templates' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500'}`}>템플릿 목록</button>
        <button type="button" role="tab" aria-selected={activeTab === 'bindings'} onClick={() => moveTab('bindings')} className={`border-b-2 px-4 py-3 text-sm font-semibold ${activeTab === 'bindings' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500'}`}>이벤트 연결</button>
      </div>
      {activeTab === 'bindings' ? <EmailTemplateBindingsPanel /> : <EmailTemplateListPanel />}
    </div>
  );
}
