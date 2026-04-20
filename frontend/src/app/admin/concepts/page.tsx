'use client';

import { useEffect, useState } from 'react';
import { conceptNoteService } from '@/services/conceptNoteService';
import type { ConceptNote } from '@/types';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function AdminConceptsPage() {
  const [notes, setNotes] = useState<ConceptNote[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  function load() {
    setLoading(true);
    conceptNoteService.adminGetAll(page, pageSize)
      .then(res => {
        const data = res.data.data;
        if (data) {
          setNotes(data.content);
          setTotalElements(data.totalElements);
          setTotalPages(data.totalPages);
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page, pageSize]); // eslint-disable-line

  function handleTogglePublic(id: number) {
    conceptNoteService.adminTogglePublic(id).then(res => {
      const updated = res.data.data;
      if (updated) {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, isPublic: updated.isPublic } : n));
      }
    });
  }

  function handleDelete(id: number) {
    if (!confirm('해당 개념노트를 삭제하시겠습니까?')) return;
    conceptNoteService.adminDelete(id).then(() => {
      setNotes(prev => prev.filter(n => n.id !== id));
      setTotalElements(prev => prev - 1);
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">개념노트 관리</h2>
        <p className="text-sm text-gray-500 mt-1">사용자가 등록한 개념노트를 관리합니다.</p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">전체 {totalElements}개</p>
        <select
          value={pageSize}
          onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
        >
          {PAGE_SIZE_OPTIONS.map(s => (
            <option key={s} value={s}>{s}개</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">로딩 중...</div>
      ) : notes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-400 text-sm">
          등록된 개념노트가 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">제목</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">작성자</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">공개</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">수정일</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {notes.map(note => (
                <>
                  <tr
                    key={note.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpanded(expanded === note.id ? null : note.id)}
                  >
                    <td className="px-4 py-3 max-w-xs truncate font-medium text-gray-800">
                      {note.title}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{note.userName ?? '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        note.isPublic
                          ? 'bg-green-50 text-green-600 border border-green-200'
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}>
                        {note.isPublic ? '공개' : '비공개'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400 text-xs">
                      {new Date(note.updatedAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleTogglePublic(note.id)}
                          className="text-xs px-2 py-1 border border-indigo-200 text-indigo-600 rounded hover:bg-indigo-50"
                        >
                          {note.isPublic ? '비공개 전환' : '공개 전환'}
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="text-xs px-2 py-1 border border-red-200 text-red-500 rounded hover:bg-red-50"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === note.id && (
                    <tr key={`${note.id}-expand`} className="bg-gray-50">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                          {note.content}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
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
    </div>
  );
}
