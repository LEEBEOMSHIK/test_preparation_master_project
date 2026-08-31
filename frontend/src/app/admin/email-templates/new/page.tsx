import { EmailTemplateForm } from '@/components/admin/EmailTemplateForm';

export default function NewEmailTemplatePage() {
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-gray-900">새 이메일 템플릿</h1><p className="mt-1 text-sm text-gray-500">문의 상태 변경 이메일에 사용할 템플릿을 만듭니다.</p></div><EmailTemplateForm mode="create" /></div>;
}
