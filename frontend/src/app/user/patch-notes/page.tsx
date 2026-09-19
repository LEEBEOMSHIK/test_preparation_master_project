'use client';

import { useCallback, useEffect, useState } from 'react';
import { CardListSkeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { RichContent } from '@/components/ui/RichContent';
import { patchNoteService } from '@/services/patchNoteService';
import type { PatchNote, PatchNoteItemType } from '@/types';

const PAGE_SIZE = 10;

const ITEM_TYPE_LABEL: Record<PatchNoteItemType, string> = {
  ADD: '추가',
  IMPROVEMENT: '개선',
  FIX: '수정',
  SECURITY: '보안',
  ETC: '기타',
};

const ITEM_TYPE_CLASS: Record<PatchNoteItemType, string> = {
  ADD: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  IMPROVEMENT: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  FIX: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  SECURITY: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
  ETC: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

function getItemTypePresentation(itemType: PatchNoteItemType): { label: string; className: string } {
  return {
    label: ITEM_TYPE_LABEL[itemType] ?? ITEM_TYPE_LABEL.ETC,
    className: ITEM_TYPE_CLASS[itemType] ?? ITEM_TYPE_CLASS.ETC,
  };
}

function formatPublishedAt(publishedAt: string | null): string {
  if (!publishedAt) return '게시일 정보 없음';

  const publishedDate = new Date(publishedAt);
  return Number.isNaN(publishedDate.getTime())
    ? '게시일 정보 없음'
    : publishedDate.toLocaleDateString('ko-KR');
}

export default function PatchNotesPage() {
  const [patchNotes, setPatchNotes] = useState<PatchNote[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadPatchNotes = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const response = await patchNoteService.getPublished(page, PAGE_SIZE);
      const data = response.data.data;

      setPatchNotes(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadPatchNotes();
  }, [loadPatchNotes]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">패치노트</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">TPMP의 최신 업데이트를 확인하세요.</p>
      </div>

      {loading ? (
        <CardListSkeleton rows={5} />
      ) : error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-8 text-center dark:border-red-900/70 dark:bg-red-950/30">
          <p className="text-sm text-red-700 dark:text-red-300">패치노트를 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={() => void loadPatchNotes()}
            className="mt-3 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/40"
          >
            다시 시도
          </button>
        </div>
      ) : patchNotes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-12 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
          게시된 패치노트가 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {patchNotes.map((patchNote) => (
            <article
              key={patchNote.id}
              className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{patchNote.version}</p>
                  <h2 className="mt-1 break-words text-base font-semibold text-gray-900 dark:text-gray-100">
                    {patchNote.title}
                  </h2>
                </div>
                <time
                  dateTime={patchNote.publishedAt ?? undefined}
                  className="shrink-0 text-xs text-gray-500 dark:text-gray-400"
                >
                  {formatPublishedAt(patchNote.publishedAt)}
                </time>
              </div>
              {patchNote.items && patchNote.items.length > 0 ? (
                <ul className="mt-4 space-y-2" aria-label={`${patchNote.version} 변경 항목`}>
                  {[...patchNote.items]
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((item) => {
                      const presentation = getItemTypePresentation(item.itemType);
                      return (
                        <li key={item.id ?? `${patchNote.id}-${item.displayOrder}-${item.summary}`} className="flex min-w-0 items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <span className={`mt-0.5 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${presentation.className}`}>
                            {presentation.label}
                          </span>
                          <span className="min-w-0 break-words">{item.summary}</span>
                        </li>
                      );
                    })}
                </ul>
              ) : (
                <RichContent html={patchNote.content} className="mt-4 text-sm text-gray-700 dark:text-gray-300" />
              )}
            </article>
          ))}
        </div>
      )}

      {!loading && !error && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} className="mt-6" />
      )}
    </div>
  );
}
