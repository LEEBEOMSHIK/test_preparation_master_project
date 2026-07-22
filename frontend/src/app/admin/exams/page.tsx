'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { examinationService } from '@/services/examinationService';
import { TableSkeleton } from '@/components/ui/Skeleton';
import type { Examination } from '@/types';
import { useColumnResize } from '@/lib/useColumnResize';
import { ColResizeHandle } from '@/components/ui/ColResizeHandle';

export default function AdminExamsPage() {
  const router = useRouter();
  // 사용여부 토글 컬럼 추가로 열 구성이 바뀌어 localStorage 키 v2→v3 갱신
  const { widths, startResize } = useColumnResize('tpmp:admin-exams:col-widths:v3', [48, 240, 140, 200, 88, 90, 100, 200]);
  const [allExams, setAllExams]   = useState<Examination[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // 검색 조건 (입력)
  const [keyword, setKeyword]             = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  // 검색 조건 (적용됨)
  const [appliedKeyword, setAppliedKeyword]             = useState('');
  const [appliedCategoryFilter, setAppliedCategoryFilter] = useState('');

  useEffect(() => {
    examinationService
      .adminGetExaminations(0, 1000)
      .then((res) => setAllExams(res.data.data?.content ?? []))
      .catch(() => setError('시험 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('이 시험을 삭제하시겠습니까?')) return;
    setDeletingId(id);
    try {
      await examinationService.adminDeleteExamination(id);
      setAllExams((prev) => prev.filter((e) => e.id !== id));
    } catch {
      setError('시험 삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (id: number) => {
    setTogglingId(id);
    try {
      const res = await examinationService.adminToggleExamination(id);
      const updated = res.data.data;
      if (updated) {
        setAllExams((prev) => prev.map((e) => (e.id === id ? { ...e, useYn: updated.useYn } : e)));
      }
    } catch {
      setError('사용여부 변경에 실패했습니다.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSearch = () => {
    setAppliedKeyword(keyword);
    setAppliedCategoryFilter(categoryFilter);
  };

  const handleReset = () => {
    setKeyword(''); setCategoryFilter('');
    setAppliedKeyword(''); setAppliedCategoryFilter('');
  };

  const categories = useMemo(() => [...new Set(allExams.map((e) => e.categoryName).filter(Boolean))], [allExams]);

  const filtered = useMemo(() => {
    const kw = appliedKeyword.trim().toLowerCase();
    return allExams.filter((e) => {
      if (kw && !e.title.toLowerCase().includes(kw)) return false;
      if (appliedCategoryFilter && e.categoryName !== appliedCategoryFilter) return false;
      return true;
    });
  }, [allExams, appliedKeyword, appliedCategoryFilter]);

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">시험 관리</h2>
          <p className="text-sm text-gray-500 mt-1">등록된 시험 목록입니다.</p>
        </div>
        <Link
          href="/admin/exams/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
        >
          + 시험 등록
        </Link>
      </div>

      {/* 검색 조건 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-500 mb-1">시험 제목</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="시험 제목 검색"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">시험 유형</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            >
              <option value="">전체</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
          >
            검색
          </button>
          {(keyword || categoryFilter || appliedKeyword || appliedCategoryFilter) && (
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-200 text-gray-500 rounded-lg text-sm hover:bg-gray-50 transition"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} cols={8} />
        ) : error ? (
          <div className="p-10 text-center text-red-400 text-sm">{error}</div>
        ) : allExams.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            등록된 시험이 없습니다.{' '}
            <Link href="/admin/exams/new" className="text-indigo-500 hover:underline">
              시험을 등록해보세요.
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">검색 결과가 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <colgroup>{widths.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500 font-medium uppercase tracking-wide">
                <th className="px-4 py-3 text-center whitespace-nowrap relative">No.<ColResizeHandle onMouseDown={(e) => startResize(0, e)} /></th>
                <th className="px-4 py-3 relative">시험 제목<ColResizeHandle onMouseDown={(e) => startResize(1, e)} /></th>
                <th className="px-4 py-3 whitespace-nowrap relative">시험 유형<ColResizeHandle onMouseDown={(e) => startResize(2, e)} /></th>
                <th className="px-4 py-3 relative">사용 시험지<ColResizeHandle onMouseDown={(e) => startResize(3, e)} /></th>
                <th className="px-4 py-3 text-center whitespace-nowrap relative">제한 시간<ColResizeHandle onMouseDown={(e) => startResize(4, e)} /></th>
                <th className="px-4 py-3 text-center whitespace-nowrap relative">사용여부<ColResizeHandle onMouseDown={(e) => startResize(5, e)} /></th>
                <th className="px-4 py-3 whitespace-nowrap relative">등록일<ColResizeHandle onMouseDown={(e) => startResize(6, e)} /></th>
                <th className="px-4 py-3 text-center whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((exam, idx) => (
                <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5 text-gray-400 text-center whitespace-nowrap">{idx + 1}</td>
                  <td className="px-4 py-3.5 font-medium text-gray-900 overflow-hidden">
                    <p className="truncate">{exam.title}</p>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600">
                      {exam.categoryName}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600 overflow-hidden">
                    <p className="truncate text-sm">{exam.examPaperTitle}</p>
                  </td>
                  <td className="px-4 py-3.5 text-center text-gray-600 whitespace-nowrap">
                    {exam.timeLimit}분
                  </td>
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <button
                      onClick={() => handleToggle(exam.id)}
                      disabled={togglingId === exam.id}
                      className={[
                        'px-2 py-1 rounded-full text-xs font-medium transition disabled:opacity-50',
                        exam.useYn === 'Y'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                      ].join(' ')}
                    >
                      {exam.useYn === 'Y' ? '사용' : '미사용'}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap">
                    {new Date(exam.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/admin/exams/${exam.id}/edit`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold transition whitespace-nowrap"
                      >
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.333 2a1.886 1.886 0 012.667 2.667L5.167 13.5H2.5v-2.667L11.333 2z" />
                        </svg>
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(exam.id)}
                        disabled={deletingId === exam.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs font-semibold transition whitespace-nowrap disabled:opacity-50"
                      >
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2 4h12M5.333 4V2.667h5.334V4M6.667 7.333v4M9.333 7.333v4M3.333 4l.667 9.333h8L12.667 4" />
                        </svg>
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
