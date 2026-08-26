'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PatchNoteForm } from '@/components/admin/PatchNoteForm';
import { patchNoteService } from '@/services/patchNoteService';
import type { PatchNoteRequest } from '@/types';

export default function NewPatchNotePage() {
  const router = useRouter();

  const handleSubmit = async (request: PatchNoteRequest) => {
    const response = await patchNoteService.adminCreate(request);
    if (!response.data.success) throw new Error(response.data.error?.message ?? response.data.message ?? '패치노트 등록에 실패했습니다.');
    router.push('/admin/patch-notes');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/patch-notes" className="text-gray-400 hover:text-gray-600" aria-label="패치노트 목록으로 이동">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">패치노트 등록</h2>
          <p className="text-sm text-gray-500 mt-0.5">새 패치노트를 등록합니다.</p>
        </div>
      </div>
      <PatchNoteForm onSubmit={handleSubmit} submitLabel="등록" cancelHref="/admin/patch-notes" />
    </div>
  );
}
