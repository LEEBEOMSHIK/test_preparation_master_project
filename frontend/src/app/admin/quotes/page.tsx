'use client';

import { useEffect, useState } from 'react';
import { quoteService } from '@/services/quoteService';
import type { Quote } from '@/types';

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  // 폼 상태
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formContent, setFormContent] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async (p = page) => {
    const res = await quoteService.adminGetAll(p, PAGE_SIZE);
    if (res.data.success && res.data.data) {
      setQuotes(res.data.data.content);
      setTotal(res.data.data.totalElements);
    }
  };

  useEffect(() => { load(); }, [page]);

  const openCreate = () => {
    setEditId(null);
    setFormContent('');
    setFormAuthor('');
    setShowForm(true);
  };

  const openEdit = (q: Quote) => {
    setEditId(q.id);
    setFormContent(q.content);
    setFormAuthor(q.author ?? '');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formContent.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        await quoteService.adminUpdate(editId, formContent, formAuthor || undefined);
      } else {
        await quoteService.adminCreate(formContent, formAuthor || undefined);
      }
      setShowForm(false);
      setPage(0);
      load(0);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (q: Quote) => {
    await quoteService.adminToggleUseYn(q.id);
    load();
  };

  const handleDelete = async (q: Quote) => {
    if (!confirm(`"${q.content.slice(0, 30)}..." 명언을 삭제하시겠습니까?`)) return;
    await quoteService.adminDelete(q.id);
    load();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">명언 관리</h2>
          <p className="text-sm text-gray-500 mt-0.5">사용자 홈 화면에 표시될 명언을 관리합니다.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          + 명언 추가
        </button>
      </div>

      {/* 등록/수정 폼 */}
      {showForm && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5 space-y-3 shadow-sm">
          <h3 className="font-semibold text-gray-800">{editId ? '명언 수정' : '새 명언 추가'}</h3>
          <textarea
            value={formContent}
            onChange={e => setFormContent(e.target.value)}
            placeholder="명언 내용을 입력하세요 *"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
          <input
            value={formAuthor}
            onChange={e => setFormAuthor(e.target.value)}
            placeholder="출처 / 저자 (선택)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formContent.trim()}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      )}

      {/* 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 w-8">No.</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">내용</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 w-36">출처/저자</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 w-24 whitespace-nowrap">사용여부</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 w-32 whitespace-nowrap">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {quotes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  등록된 명언이 없습니다.
                </td>
              </tr>
            )}
            {quotes.map((q, idx) => (
              <tr key={q.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                  {page * PAGE_SIZE + idx + 1}
                </td>
                <td className="px-4 py-3 text-gray-800 max-w-md">
                  <p className="line-clamp-2">{q.content}</p>
                </td>
                <td className="px-4 py-3 text-gray-500">{q.author ?? '-'}</td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <button
                    onClick={() => handleToggle(q)}
                    className={[
                      'px-2 py-1 rounded-full text-xs font-medium transition',
                      q.useYn === 'Y'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                    ].join(' ')}
                  >
                    {q.useYn === 'Y' ? '사용' : '미사용'}
                  </button>
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <div className="flex gap-1.5 justify-center flex-nowrap">
                    <button
                      onClick={() => openEdit(q)}
                      className="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(q)}
                      className="px-2.5 py-1 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={[
                'px-3 py-1.5 text-sm border rounded-lg',
                i === page
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-gray-300 hover:bg-gray-50',
              ].join(' ')}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
