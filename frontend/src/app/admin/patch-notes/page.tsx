'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { patchNoteService } from '@/services/patchNoteService';
import type { PatchNote, PageResponse } from '@/types';

const PAGE_SIZE = 10;

function formatDate(value: string | null): string {
  return value ? value.slice(0, 10) : '-';
}

export default function AdminPatchNotesPage() {
  const [pageData, setPageData] = useState<PageResponse<PatchNote> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadPatchNotes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await patchNoteService.adminGetAll(page, PAGE_SIZE);
      if (!response.data.success || !response.data.data) {
        setError(response.data.error?.message ?? response.data.message ?? '패치노트 목록을 불러오지 못했습니다.');
        return;
      }
      setPageData(response.data.data);
    } catch {
      setError('패치노트 목록을 불러오지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadPatchNotes();
  }, [loadPatchNotes]);

  const handlePublication = async (patchNote: PatchNote) => {
    const nextPublished = !patchNote.published;
    if (!confirm(`이 패치노트를 ${nextPublished ? '게시' : '비게시'}하시겠습니까?`)) return;

    setProcessingId(patchNote.id);
    try {
      const response = await patchNoteService.adminUpdatePublication(patchNote.id, { published: nextPublished });
      if (!response.data.success) throw new Error(response.data.error?.message ?? response.data.message ?? '게시 상태 변경에 실패했습니다.');
      await loadPatchNotes();
    } catch (updateError: unknown) {
      setError(updateError instanceof Error ? updateError.message : '게시 상태 변경에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (patchNote: PatchNote) => {
    if (!confirm(`'${patchNote.title}' 패치노트를 삭제하시겠습니까?`)) return;

    setProcessingId(patchNote.id);
    try {
      const response = await patchNoteService.adminDelete(patchNote.id);
      if (!response.data.success) throw new Error(response.data.error?.message ?? response.data.message ?? '패치노트 삭제에 실패했습니다.');
      await loadPatchNotes();
    } catch (deleteError: unknown) {
      setError(deleteError instanceof Error ? deleteError.message : '패치노트 삭제에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">패치노트 관리</h2>
          <p className="text-sm text-gray-500 mt-0.5">서비스 변경 사항을 관리합니다.</p>
        </div>
        <Link href="/admin/patch-notes/new" className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          패치노트 등록
        </Link>
      </div>

      {error && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => void loadPatchNotes()} className="shrink-0 font-medium underline">다시 시도</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <TableSkeleton rows={5} cols={6} /> : pageData?.content.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">등록된 패치노트가 없습니다.</div>
        ) : pageData ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">버전</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">제목</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">게시 상태</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">최초 게시일</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">최종 수정일</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageData.content.map((patchNote) => (
                  <tr key={patchNote.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-indigo-700 whitespace-nowrap">{patchNote.version}</td>
                    <td className="px-4 py-3 text-gray-900 max-w-[320px] truncate">{patchNote.title}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={[
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        patchNote.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
                      ].join(' ')}>{patchNote.published ? '게시' : '비게시'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(patchNote.publishedAt)}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(patchNote.updatedAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-1.5">
                        <Link href={`/admin/patch-notes/${patchNote.id}/edit`} className="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">수정</Link>
                        <button type="button" onClick={() => void handlePublication(patchNote)} disabled={processingId === patchNote.id} className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors">
                          {patchNote.published ? '비게시' : '게시'}
                        </button>
                        <button type="button" onClick={() => void handleDelete(patchNote)} disabled={processingId === patchNote.id} className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors">삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {!loading && pageData && pageData.totalElements > 0 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-gray-500">총 {pageData.totalElements}건</p>
          <Pagination page={page} totalPages={pageData.totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
