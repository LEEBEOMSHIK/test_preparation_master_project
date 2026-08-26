'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { PatchNoteForm } from '@/components/admin/PatchNoteForm';
import { Skeleton } from '@/components/ui/Skeleton';
import { ApiApplicationError, extractApiErrorMessage } from '@/lib/apiError';
import { patchNoteService } from '@/services/patchNoteService';
import type { PatchNote, PatchNoteRequest } from '@/types';

export default function EditPatchNotePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [patchNote, setPatchNote] = useState<PatchNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const patchNoteId = Number(id);

  const loadPatchNote = useCallback(async () => {
    if (!Number.isInteger(patchNoteId) || patchNoteId < 1) {
      setError('유효하지 않은 패치노트입니다.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await patchNoteService.adminGetById(patchNoteId);
      if (!response.data.success || !response.data.data) {
        throw new ApiApplicationError(
          response.data.error?.message ?? response.data.message ?? '패치노트를 찾을 수 없습니다.',
        );
      }
      setPatchNote(response.data.data);
    } catch (loadError: unknown) {
      setError(extractApiErrorMessage(loadError, '패치노트를 불러오지 못했습니다. 다시 시도해 주세요.'));
    } finally {
      setLoading(false);
    }
  }, [patchNoteId]);

  useEffect(() => {
    void loadPatchNote();
  }, [loadPatchNote]);

  const handleSubmit = async (request: PatchNoteRequest) => {
    const response = await patchNoteService.adminUpdate(patchNoteId, request);
    if (!response.data.success) {
      throw new ApiApplicationError(response.data.error?.message ?? response.data.message ?? '패치노트 수정에 실패했습니다.');
    }
    router.push('/admin/patch-notes');
  };

  if (loading) {
    return (
      <div className="max-w-3xl space-y-6 animate-pulse">
        <Skeleton className="h-7 w-40" />
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !patchNote) {
    return (
      <div className="max-w-3xl bg-white rounded-xl border border-gray-200 p-8 text-center space-y-4">
        <p role="alert" className="text-sm text-red-600">{error || '패치노트를 찾을 수 없습니다.'}</p>
        <Link href="/admin/patch-notes" className="inline-flex px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          목록으로 이동
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/patch-notes" className="text-gray-400 hover:text-gray-600" aria-label="패치노트 목록으로 이동">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">패치노트 수정</h2>
          <p className="text-sm text-gray-500 mt-0.5">패치노트 내용을 수정합니다.</p>
        </div>
      </div>
      <PatchNoteForm
        initialValue={{ title: patchNote.title, version: patchNote.version, content: patchNote.content, published: patchNote.published }}
        onSubmit={handleSubmit}
        submitLabel="수정 저장"
        cancelHref="/admin/patch-notes"
      />
    </div>
  );
}
