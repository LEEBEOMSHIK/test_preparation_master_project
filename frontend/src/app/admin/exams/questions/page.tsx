'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { examService } from '@/services/examService';
import { TableSkeleton } from '@/components/ui/Skeleton';
import type { QuestionSummary, QuestionType } from '@/types';

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: '객관식',
  SHORT_ANSWER: '주관식',
  OX: 'O/X',
  CODE: '코드',
};

const TYPE_COLOR: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'bg-blue-50 text-blue-600',
  SHORT_ANSWER:    'bg-green-50 text-green-600',
  OX:              'bg-amber-50 text-amber-600',
  CODE:            'bg-violet-50 text-violet-600',
};

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminQuestionsPage() {
  const router = useRouter();

  // 원본 데이터
  const [allQuestions, setAllQuestions] = useState<QuestionSummary[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [deletingId,   setDeletingId]   = useState<number | null>(null);

  // 검색 조건
  const [keyword,  setKeyword]  = useState('');
  const [typeFilter, setTypeFilter] = useState<QuestionType | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  // 페이지네이션
  const [page,     setPage]     = useState(0);
  const [pageSize, setPageSize] = useState<10 | 20 | 50>(10);

  // 초기 로딩
  useEffect(() => {
    examService
      .adminGetQuestions(0, 500)
      .then((res) => setAllQuestions(res.data.data?.content ?? []))
      .catch(() => setError('문항 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  // 삭제
  const handleDelete = async (id: number) => {
    if (!confirm('이 문항을 삭제하시겠습니까?')) return;
    setDeletingId(id);
    try {
      await examService.adminDeleteQuestion(id);
      setAllQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch {
      setError('문항 삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  // 검색 실행 (검색 버튼 / 조건 즉시 반영)
  const handleSearch = () => setPage(0);

  // 필터링
  const filtered = useMemo(() => {
    const kw      = keyword.trim().toLowerCase();
    const fromMs  = dateFrom ? new Date(dateFrom).getTime() : null;
    const toMs    = dateTo   ? new Date(dateTo + 'T23:59:59').getTime() : null;

    return allQuestions.filter((q) => {
      if (kw && !q.content.toLowerCase().includes(kw)) return false;
      if (typeFilter && q.questionType !== typeFilter) return false;
      const created = new Date(q.createdAt).getTime();
      if (fromMs && created < fromMs) return false;
      if (toMs   && created > toMs)   return false;
      return true;
    });
  }, [allQuestions, keyword, typeFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged      = filtered.slice(page * pageSize, (page + 1) * pageSize);

  // 페이지 크기 변경 시 첫 페이지로
  const handlePageSizeChange = (size: 10 | 20 | 50) => {
    setPageSize(size);
    setPage(0);
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">문항 관리</h2>
          <p className="text-sm text-gray-500 mt-1">등록된 문항 목록입니다.</p>
        </div>
        <Link
          href="/admin/exams/questions/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
        >
          + 문항 등록
        </Link>
      </div>

      {/* 검색 조건 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* 내용 검색 */}
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-500 mb-1">문항 내용</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="검색어를 입력하세요"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>

          {/* 유형 필터 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">유형</label>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value as QuestionType | ''); setPage(0); }}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            >
              <option value="">전체</option>
              {(Object.keys(TYPE_LABEL) as QuestionType[]).map((t) => (
                <option key={t} value={t}>{TYPE_LABEL[t]}</option>
              ))}
            </select>
          </div>

          {/* 등록일 from */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">등록일 (시작)</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>

          {/* 등록일 to */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">등록일 (종료)</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>

          {/* 검색 버튼 */}
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
          >
            검색
          </button>

          {/* 초기화 */}
          {(keyword || typeFilter || dateFrom || dateTo) && (
            <button
              onClick={() => { setKeyword(''); setTypeFilter(''); setDateFrom(''); setDateTo(''); setPage(0); }}
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
          <TableSkeleton rows={5} cols={5} />
        ) : error ? (
          <div className="p-10 text-center text-red-400 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            {allQuestions.length === 0 ? (
              <>
                등록된 문항이 없습니다.{' '}
                <Link href="/admin/exams/questions/new" className="text-indigo-500 hover:underline">
                  문항을 등록해보세요.
                </Link>
              </>
            ) : '검색 결과가 없습니다.'}
          </div>
        ) : (
          <>
            {/* 결과 요약 + 페이지 크기 */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-500">
                총 <span className="font-semibold text-gray-700">{filtered.length}</span>개 문항
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">페이지당</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value) as 10 | 20 | 50)}
                  className="px-2 py-1 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}개</option>
                  ))}
                </select>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500 font-medium uppercase tracking-wide">
                  <th className="px-4 py-3 w-12 text-center whitespace-nowrap">No.</th>
                  <th className="px-4 py-3">문항 내용</th>
                  <th className="px-4 py-3 w-24 text-center whitespace-nowrap">유형</th>
                  <th className="px-4 py-3 w-28 whitespace-nowrap">등록일</th>
                  <th className="px-4 py-3 w-40 text-center whitespace-nowrap">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paged.map((q, idx) => (
                  <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 text-gray-400 text-center whitespace-nowrap">
                      {page * pageSize + idx + 1}
                    </td>
                    <td className="px-4 py-3.5 text-gray-900 max-w-0">
                      <p className="truncate">{q.content.replace(/<[^>]+>/g, '')}</p>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <span className={[
                        'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                        TYPE_COLOR[q.questionType],
                      ].join(' ')}>
                        {TYPE_LABEL[q.questionType]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap">
                      {new Date(q.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/admin/exams/questions/${q.id}/edit`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold transition whitespace-nowrap"
                        >
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.333 2a1.886 1.886 0 012.667 2.667L5.167 13.5H2.5v-2.667L11.333 2z" />
                          </svg>
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          disabled={deletingId === q.id}
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

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 px-5 py-4 border-t border-gray-100">
                {/* 이전 */}
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* 페이지 번호 */}
                {Array.from({ length: totalPages }, (_, i) => {
                  const show =
                    i === 0 ||
                    i === totalPages - 1 ||
                    Math.abs(i - page) <= 2;
                  const gap =
                    i > 0 &&
                    Math.abs(i - page) === 3 &&
                    (i === 1 || i === totalPages - 2);
                  if (!show && !gap) return null;
                  if (gap) return <span key={i} className="w-8 text-center text-gray-400 text-xs">…</span>;
                  return (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={[
                        'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition',
                        page === i
                          ? 'bg-indigo-600 text-white'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50',
                      ].join(' ')}
                    >
                      {i + 1}
                    </button>
                  );
                })}

                {/* 다음 */}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
