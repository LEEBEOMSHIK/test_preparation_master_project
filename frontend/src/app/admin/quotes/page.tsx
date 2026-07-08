'use client';

import { useEffect, useState, useMemo } from 'react';
import { quoteService } from '@/services/quoteService';
import { useColumnResize } from '@/lib/useColumnResize';
import { ColResizeHandle } from '@/components/ui/ColResizeHandle';
import { Pagination } from '@/components/ui/Pagination';
import type { Quote } from '@/types';

const PAGE_SIZE = 20;

export default function AdminQuotesPage() {
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const [page, setPage]           = useState(0);

  // 폼 상태
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState<number | null>(null);
  const [formContent, setFormContent] = useState('');
  const [formAuthor, setFormAuthor]   = useState('');
  const [saving, setSaving]           = useState(false);

  // 검색 조건 (입력)
  const [keyword, setKeyword]               = useState('');
  // 검색 조건 (적용됨)
  const [appliedKeyword, setAppliedKeyword] = useState('');

  // 관리 컬럼(수정/삭제 버튼) 클리핑 방지 위해 100→160 확대 + localStorage 키 v2 갱신
  const { widths, startResize } = useColumnResize(
    'tpmp:admin-quotes:col-widths:v2',
    [48, 320, 140, 80, 160],
  );

  const load = async () => {
    const res = await quoteService.adminGetAll(0, 10000);
    if (res.data.success && res.data.data) {
      setAllQuotes(res.data.data.content);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = () => { setAppliedKeyword(keyword); setPage(0); };
  const handleReset  = () => { setKeyword(''); setAppliedKeyword(''); setPage(0); };

  const filtered = useMemo(() => {
    if (!appliedKeyword) return allQuotes;
    const kw = appliedKeyword.toLowerCase();
    return allQuotes.filter((q) =>
      q.content.toLowerCase().includes(kw) || (q.author ?? '').toLowerCase().includes(kw)
    );
  }, [allQuotes, appliedKeyword]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged      = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const openCreate = () => {
    setEditId(null); setFormContent(''); setFormAuthor(''); setShowForm(true);
  };

  const openEdit = (q: Quote) => {
    setEditId(q.id); setFormContent(q.content); setFormAuthor(q.author ?? ''); setShowForm(true);
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
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (q: Quote) => {
    await quoteService.adminToggleUseYn(q.id);
    await load();
  };

  const handleDelete = async (q: Quote) => {
    if (!confirm(`"${q.content.slice(0, 30)}..." 명언을 삭제하시겠습니까?`)) return;
    await quoteService.adminDelete(q.id);
    setAllQuotes((prev) => prev.filter((item) => item.id !== q.id));
  };

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

      {/* 검색 조건 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-500 mb-1">내용 / 출처</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="명언 내용 또는 출처 검색"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
          >
            검색
          </button>
          {(keyword || appliedKeyword) && (
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-200 text-gray-500 rounded-lg text-sm hover:bg-gray-50 transition"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 등록/수정 폼 */}
      {showForm && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5 space-y-3 shadow-sm">
          <h3 className="font-semibold text-gray-800">{editId ? '명언 수정' : '새 명언 추가'}</h3>
          <textarea
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            placeholder="명언 내용을 입력하세요 *"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
          <input
            value={formAuthor}
            onChange={(e) => setFormAuthor(e.target.value)}
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
        <div className="overflow-x-auto">
        <table className="w-full table-fixed text-sm">
          <colgroup>{widths.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 relative">No.<ColResizeHandle onMouseDown={(e) => startResize(0, e)} /></th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 relative">내용<ColResizeHandle onMouseDown={(e) => startResize(1, e)} /></th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 relative">출처/저자<ColResizeHandle onMouseDown={(e) => startResize(2, e)} /></th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 whitespace-nowrap relative">사용여부<ColResizeHandle onMouseDown={(e) => startResize(3, e)} /></th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 whitespace-nowrap">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  {allQuotes.length === 0 ? '등록된 명언이 없습니다.' : '검색 결과가 없습니다.'}
                </td>
              </tr>
            )}
            {paged.map((q, idx) => (
              <tr key={q.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                  {page * PAGE_SIZE + idx + 1}
                </td>
                <td className="px-4 py-3 text-gray-800 overflow-hidden">
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
      </div>

      {/* 페이지네이션 */}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
