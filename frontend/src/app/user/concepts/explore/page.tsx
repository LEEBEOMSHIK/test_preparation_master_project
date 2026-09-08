'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { conceptNoteService } from '@/services/conceptNoteService';
import { CardListSkeleton } from '@/components/ui/Skeleton';
import { stripHtml } from '@/lib/html';
import { ListPagination } from '@/components/ui/ListPagination';
import { extractApiErrorMessage } from '@/lib/apiError';
import type { ConceptNote } from '@/types';

export default function ConceptExploreListPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<ConceptNote[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    conceptNoteService.getPublicNotes(page, pageSize, keyword || undefined)
      .then(res => {
        if (!active) return;
        const data = res.data.data;
        if (!data) throw new Error('Missing page response');
        if (page > 0 && page >= data.totalPages) {
          setPage(Math.max(0, data.totalPages - 1));
        } else {
          setNotes(data.content);
          setTotalElements(data.totalElements);
          setTotalPages(data.totalPages);
        }
      })
      .catch((err: unknown) => {
        if (active) setError(extractApiErrorMessage(err, '공개 개념노트를 불러오지 못했습니다.'));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, pageSize, keyword, reload]);

  function handleSearch() {
    setKeyword(searchInput.trim());
    setPage(0);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(0);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">공개 개념노트 탐색</h1>
      </div>

      {/* 검색 + 페이지 크기 */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="제목 검색"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button
          onClick={handleSearch}
          className="shrink-0 whitespace-nowrap px-4 py-2 bg-gray-100 border border-gray-300 text-sm rounded-lg hover:bg-gray-200"
        >
          검색
        </button>
      </div>

      {/* 목록 */}
      <div id="public-concept-list" className="scroll-mt-24">
      {loading ? (
        <CardListSkeleton rows={5} />
      ) : error ? (
        <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          <p>{error}</p>
          <button onClick={() => setReload(value => value + 1)} className="mt-2 underline">다시 시도</button>
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {keyword
            ? '검색 결과가 없습니다.'
            : '아직 공개된 개념노트가 없습니다. 내 노트에서 공개 설정 후 탐색할 수 있습니다.'}
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div
              key={note.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-colors cursor-pointer"
              onClick={() => router.push(`/user/concepts/explore/${note.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold text-gray-800 truncate">{note.title}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full shrink-0 bg-green-50 text-green-600 border border-green-200">
                      공개
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">
                    작성자: {note.userName}
                  </p>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {stripHtml(note.content)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-xs text-gray-400">
                    {new Date(note.updatedAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* 페이지네이션 */}
      {!loading && !error && (
        <ListPagination page={page} totalPages={totalPages} totalElements={totalElements}
          pageSize={pageSize} onChange={setPage} onPageSizeChange={handlePageSizeChange}
          scrollTargetId="public-concept-list" />
      )}
    </div>
  );
}
