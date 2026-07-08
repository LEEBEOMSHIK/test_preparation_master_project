'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { examService } from '@/services/examService';
import { TableSkeleton } from '@/components/ui/Skeleton';
import type { ExamSummary } from '@/types';
import { useColumnResize } from '@/lib/useColumnResize';
import { ColResizeHandle } from '@/components/ui/ColResizeHandle';

const MODE_LABEL: Record<string, string> = {
  SEQUENTIAL: '순차',
  RANDOM: '랜덤',
};

export default function AdminExamPapersPage() {
  const router = useRouter();
  // 관리 컬럼(수정/삭제 버튼) 클리핑 방지 위해 160→200 확대 + localStorage 키 v2 갱신
  const { widths, startResize } = useColumnResize('tpmp:admin-exam-papers:col-widths:v2', [48, 280, 96, 72, 100, 200]);
  const [allPapers, setAllPapers] = useState<ExamSummary[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 검색 조건 (입력)
  const [keyword, setKeyword]     = useState('');
  const [modeFilter, setModeFilter] = useState('');
  // 검색 조건 (적용됨)
  const [appliedKeyword, setAppliedKeyword]     = useState('');
  const [appliedModeFilter, setAppliedModeFilter] = useState('');

  useEffect(() => {
    examService
      .adminGetExams(0, 1000)
      .then((res) => setAllPapers(res.data.data?.content ?? []))
      .catch(() => setError('시험지 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('이 시험지를 삭제하시겠습니까?\n포함된 문항도 함께 삭제됩니다.')) return;
    setDeletingId(id);
    try {
      await examService.adminDeleteExam(id);
      setAllPapers((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError('시험지 삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSearch = () => {
    setAppliedKeyword(keyword);
    setAppliedModeFilter(modeFilter);
  };

  const handleReset = () => {
    setKeyword(''); setModeFilter('');
    setAppliedKeyword(''); setAppliedModeFilter('');
  };

  const filtered = useMemo(() => {
    const kw = appliedKeyword.trim().toLowerCase();
    const base = allPapers.filter((p) => {
      if (kw && !p.title.toLowerCase().includes(kw)) return false;
      if (appliedModeFilter && p.questionMode !== appliedModeFilter) return false;
      return true;
    });
    return [...base].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allPapers, appliedKeyword, appliedModeFilter]);

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">시험지 관리</h2>
          <p className="text-sm text-gray-500 mt-1">등록된 시험지 목록입니다.</p>
        </div>
        <Link
          href="/admin/exams/papers/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
        >
          + 시험지 등록
        </Link>
      </div>

      {/* 검색 조건 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-500 mb-1">시험지 제목</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="시험지 제목 검색"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">출제 방식</label>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            >
              <option value="">전체</option>
              {Object.entries(MODE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
          >
            검색
          </button>
          {(keyword || modeFilter || appliedKeyword || appliedModeFilter) && (
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
          <TableSkeleton rows={5} cols={6} />
        ) : error ? (
          <div className="p-10 text-center text-red-400 text-sm">{error}</div>
        ) : allPapers.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            등록된 시험지가 없습니다.{' '}
            <Link href="/admin/exams/papers/new" className="text-indigo-500 hover:underline">
              시험지를 등록해보세요.
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
                <th className="px-4 py-3 relative">시험지 제목<ColResizeHandle onMouseDown={(e) => startResize(1, e)} /></th>
                <th className="px-4 py-3 text-center whitespace-nowrap relative">출제 방식<ColResizeHandle onMouseDown={(e) => startResize(2, e)} /></th>
                <th className="px-4 py-3 text-center whitespace-nowrap relative">문항 수<ColResizeHandle onMouseDown={(e) => startResize(3, e)} /></th>
                <th className="px-4 py-3 whitespace-nowrap relative">등록일<ColResizeHandle onMouseDown={(e) => startResize(4, e)} /></th>
                <th className="px-4 py-3 text-center whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((paper, idx) => (
                <tr key={paper.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5 text-gray-400 text-center whitespace-nowrap">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-gray-900 overflow-hidden">
                    <p className="truncate">{paper.title}</p>
                  </td>
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <span className={[
                      'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                      paper.questionMode === 'RANDOM'
                        ? 'bg-purple-50 text-purple-600'
                        : 'bg-blue-50 text-blue-600',
                    ].join(' ')}>
                      {MODE_LABEL[paper.questionMode] ?? paper.questionMode}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center text-gray-600 whitespace-nowrap">
                    {paper.questionCount}
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap">
                    {new Date(paper.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/admin/exams/papers/${paper.id}/edit`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold transition whitespace-nowrap"
                      >
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.333 2a1.886 1.886 0 012.667 2.667L5.167 13.5H2.5v-2.667L11.333 2z" />
                        </svg>
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(paper.id)}
                        disabled={deletingId === paper.id}
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
