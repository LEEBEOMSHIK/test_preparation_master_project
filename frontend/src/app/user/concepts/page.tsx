'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { conceptNoteService } from '@/services/conceptNoteService';
import type { ConceptNote } from '@/types';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function UserConceptsPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<ConceptNote[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    conceptNoteService.getMyNotes(page, pageSize)
      .then(res => {
        const data = res.data.data;
        if (data) {
          setNotes(data.content);
          setTotalElements(data.totalElements);
          setTotalPages(data.totalPages);
        }
      })
      .finally(() => setLoading(false));
  }, [page, pageSize]);

  const filtered = search
    ? notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()))
    : notes;

  function handleSearch() {
    setSearch(searchInput);
    setPage(0);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(0);
  }

  function handleDelete(id: number) {
    if (!confirm('개념노트를 삭제하시겠습니까?')) return;
    conceptNoteService.delete(id).then(() => {
      setNotes(prev => prev.filter(n => n.id !== id));
      setTotalElements(prev => prev - 1);
    });
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">개념노트</h1>
        <button
          onClick={() => router.push('/user/concepts/new')}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
        >
          + 새 노트 작성
        </button>
      </div>

      {/* Search + PageSize */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="제목 검색"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-gray-100 border border-gray-300 text-sm rounded-lg hover:bg-gray-200"
        >
          검색
        </button>
        <select
          value={pageSize}
          onChange={e => handlePageSizeChange(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          {PAGE_SIZE_OPTIONS.map(s => (
            <option key={s} value={s}>{s}개</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">로딩 중...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {search ? '검색 결과가 없습니다.' : '작성된 개념노트가 없습니다.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(note => (
            <div
              key={note.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-colors cursor-pointer"
              onClick={() => router.push(`/user/concepts/${note.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold text-gray-800 truncate">{note.title}</h2>
                    {note.questionId && (
                      <span className="text-xs px-2 py-0.5 rounded-full shrink-0 bg-blue-50 text-blue-600 border border-blue-100">
                        시험문제
                      </span>
                    )}
                    {note.questionBankId && (
                      <span className="text-xs px-2 py-0.5 rounded-full shrink-0 bg-purple-50 text-purple-600 border border-purple-100">
                        퀴즈문제
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      note.isPublic
                        ? 'bg-green-50 text-green-600 border border-green-200'
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}>
                      {note.isPublic ? '공개' : '비공개'}
                    </span>
                  </div>
                  {(note.questionContent || note.questionBankContent) && (
                    <p className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5 mb-1.5 line-clamp-1">
                      <span className="font-medium">문제:</span>{' '}
                      {note.questionContent || note.questionBankContent}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 line-clamp-2">{note.content}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-400">
                    {new Date(note.updatedAt).toLocaleDateString('ko-KR')}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(note.id); }}
                    className="text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-2 py-1 rounded"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!search && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`px-3 py-1.5 text-sm rounded-lg border ${
                i === page
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            다음
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400 text-right mt-3">전체 {totalElements}개</p>
    </div>
  );
}
