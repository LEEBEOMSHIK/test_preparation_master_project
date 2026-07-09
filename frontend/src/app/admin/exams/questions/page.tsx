'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { examService } from '@/services/examService';
import { TableSkeleton } from '@/components/ui/Skeleton';
import type { QuestionSummary, QuestionType } from '@/types';
import { stripHtml } from '@/lib/html';
import { QuestionDetailModal, type QuestionDetailItem } from '@/components/ui/QuestionDetailModal';
import { useColumnResize } from '@/lib/useColumnResize';
import { ColResizeHandle } from '@/components/ui/ColResizeHandle';
import { Pagination } from '@/components/ui/Pagination';
import { compareQuestionSourceOrder } from '@/lib/questionSort';

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: '객관식',
  SHORT_ANSWER: '주관식',
  OX: 'O/X',
  CODE: '코드',
  SCHEDULING: '스케줄링',
  SQL: 'SQL',
};

const TYPE_COLOR: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'bg-blue-50 text-blue-600',
  SHORT_ANSWER:    'bg-green-50 text-green-600',
  OX:              'bg-amber-50 text-amber-600',
  CODE:            'bg-violet-50 text-violet-600',
  SCHEDULING:      'bg-teal-50 text-teal-600',
  SQL:             'bg-cyan-50 text-cyan-600',
};

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
type SortField = 'sourceOrder' | 'createdAt' | 'updatedAt';

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8}
         className={['w-3 h-3 ml-1 shrink-0', active ? 'text-indigo-500' : 'text-gray-300'].join(' ')}>
      {dir === 'desc' || !active
        ? <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v10M4 9l4 4 4-4" />
        : <path strokeLinecap="round" strokeLinejoin="round" d="M8 13V3M4 7l4-4 4 4" />}
    </svg>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminQuestionsPage() {
  const router = useRouter();

  const [allQuestions, setAllQuestions] = useState<QuestionSummary[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [deletingId,   setDeletingId]   = useState<number | null>(null);
  const [detailQ,      setDetailQ]      = useState<QuestionDetailItem | null>(null);

  // 검색 조건 (입력)
  const [keyword,          setKeyword]          = useState('');
  const [typeFilter,       setTypeFilter]       = useState<QuestionType | ''>('');
  const [categoryFilter,   setCategoryFilter]   = useState('');
  const [yearFilter,       setYearFilter]       = useState('');
  const [roundFilter,      setRoundFilter]      = useState('');
  const [dateFrom,         setDateFrom]         = useState('');
  const [dateTo,           setDateTo]           = useState('');

  // 검색 조건 (적용됨)
  const [appliedKeyword,          setAppliedKeyword]          = useState('');
  const [appliedTypeFilter,       setAppliedTypeFilter]       = useState<QuestionType | ''>('');
  const [appliedCategoryFilter,   setAppliedCategoryFilter]   = useState('');
  const [appliedYearFilter,       setAppliedYearFilter]       = useState('');
  const [appliedRoundFilter,      setAppliedRoundFilter]      = useState('');
  const [appliedDateFrom,         setAppliedDateFrom]         = useState('');
  const [appliedDateTo,           setAppliedDateTo]           = useState('');

  // 정렬
  const [sortField, setSortField] = useState<SortField>('sourceOrder');
  const [sortDir,   setSortDir]   = useState<'asc' | 'desc'>('desc');

  // 페이지네이션
  const [page,     setPage]     = useState(0);
  const [pageSize, setPageSize] = useState<10 | 20 | 50>(10);

  // 컬럼 드래그 리사이즈 (No. / 문항제목 / 유형 / 카테고리 / 등록일 / 수정일 / 관리)
  // 관리 컬럼(상세/수정/삭제 버튼 3개, ~232px) 클리핑 방지 위해 160→240 확대 + localStorage 키 v2 갱신
  const { widths, startResize } = useColumnResize(
    'tpmp:admin-questions:col-widths:v2',
    [56, 360, 96, 112, 112, 112, 240],
  );

  useEffect(() => {
    examService
      .adminGetQuestions(0, 500)
      .then((res) => setAllQuestions(res.data.data?.content ?? []))
      .catch(() => setError('문항 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

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

  const handleSearch = () => {
    setAppliedKeyword(keyword);
    setAppliedTypeFilter(typeFilter);
    setAppliedCategoryFilter(categoryFilter);
    setAppliedYearFilter(yearFilter);
    setAppliedRoundFilter(roundFilter);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setPage(0);
  };

  const handleSort = (field: SortField) => {
    if (field === 'sourceOrder') {
      setSortField('sourceOrder');
      setSortDir('desc');
      setPage(0);
      return;
    }
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(0);
  };

  // 로드된 전체 문항에서 중복 제거한 카테고리 목록 산출
  const categoryOptions = useMemo(() => {
    const names = allQuestions
      .map((q) => q.categoryName ?? null)
      .filter((n): n is string => n !== null && n.trim() !== '');
    return Array.from(new Set(names)).sort();
  }, [allQuestions]);

  // 시험연도 옵션: distinct, 내림차순(최신 연도 위)
  const yearOptions = useMemo(() => {
    const years = allQuestions
      .map((q) => q.examYear)
      .filter((v): v is number => v != null);
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [allQuestions]);

  // 회차 옵션: distinct, 오름차순
  const roundOptions = useMemo(() => {
    const rounds = allQuestions
      .map((q) => q.examRound)
      .filter((v): v is number => v != null);
    return Array.from(new Set(rounds)).sort((a, b) => a - b);
  }, [allQuestions]);

  const filtered = useMemo(() => {
    const kw     = appliedKeyword.trim().toLowerCase();
    const fromMs = appliedDateFrom ? new Date(appliedDateFrom).getTime() : null;
    const toMs   = appliedDateTo   ? new Date(appliedDateTo + 'T23:59:59').getTime() : null;

    const base = allQuestions.filter((q) => {
      if (kw) {
        const inTitle   = q.title?.toLowerCase().includes(kw) ?? false;
        const inContent = q.content.toLowerCase().includes(kw);
        if (!inTitle && !inContent) return false;
      }
      if (appliedTypeFilter && q.questionType !== appliedTypeFilter) return false;
      if (appliedCategoryFilter !== '') {
        if (appliedCategoryFilter === '__UNCATEGORIZED__') {
          if (q.categoryName) return false;
        } else {
          if (q.categoryName !== appliedCategoryFilter) return false;
        }
      }
      if (appliedYearFilter  !== '' && q.examYear  !== Number(appliedYearFilter))  return false;
      if (appliedRoundFilter !== '' && q.examRound !== Number(appliedRoundFilter)) return false;
      const created = new Date(q.createdAt).getTime();
      if (fromMs && created < fromMs) return false;
      if (toMs   && created > toMs)   return false;
      return true;
    });

    return [...base].sort((a, b) => {
      if (sortField === 'sourceOrder') {
        return compareQuestionSourceOrder(a, b);
      }
      const av = sortField === 'updatedAt' ? (a.updatedAt ?? a.createdAt) : a.createdAt;
      const bv = sortField === 'updatedAt' ? (b.updatedAt ?? b.createdAt) : b.createdAt;
      const diff = new Date(av).getTime() - new Date(bv).getTime();
      return sortDir === 'asc' ? diff : -diff;
    });
  }, [allQuestions, appliedKeyword, appliedTypeFilter, appliedCategoryFilter, appliedYearFilter, appliedRoundFilter, appliedDateFrom, appliedDateTo, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged      = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const handlePageSizeChange = (size: 10 | 20 | 50) => {
    setPageSize(size);
    setPage(0);
  };

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('ko-KR');

  return (
    <>
    <QuestionDetailModal question={detailQ} onClose={() => setDetailQ(null)} />
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

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">유형</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as QuestionType | '')}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            >
              <option value="">전체</option>
              {(Object.keys(TYPE_LABEL) as QuestionType[]).map((t) => (
                <option key={t} value={t}>{TYPE_LABEL[t]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">카테고리</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            >
              <option value="">전체</option>
              <option value="__UNCATEGORIZED__">미분류</option>
              {categoryOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="w-28">
            <label className="block text-xs font-medium text-gray-500 mb-1">시험연도</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            >
              <option value="">전체</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
          </div>

          <div className="w-24">
            <label className="block text-xs font-medium text-gray-500 mb-1">회차</label>
            <select
              value={roundFilter}
              onChange={(e) => setRoundFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            >
              <option value="">전체</option>
              {roundOptions.map((r) => (
                <option key={r} value={r}>제{r}회</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">등록일 (시작)</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">등록일 (종료)</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>

          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
          >
            검색
          </button>

          {(keyword || typeFilter || categoryFilter || yearFilter || roundFilter || dateFrom || dateTo ||
            appliedKeyword || appliedTypeFilter || appliedCategoryFilter || appliedYearFilter || appliedRoundFilter || appliedDateFrom || appliedDateTo) && (
            <button
              onClick={() => {
                setKeyword(''); setTypeFilter(''); setCategoryFilter(''); setYearFilter(''); setRoundFilter(''); setDateFrom(''); setDateTo('');
                setAppliedKeyword(''); setAppliedTypeFilter(''); setAppliedCategoryFilter(''); setAppliedYearFilter(''); setAppliedRoundFilter(''); setAppliedDateFrom(''); setAppliedDateTo('');
                setPage(0);
              }}
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
          <TableSkeleton rows={5} cols={7} />
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

            <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                {widths.map((w, i) => (
                  <col key={i} style={{ width: w }} />
                ))}
              </colgroup>
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500 font-medium uppercase tracking-wide">
                  <th className="relative px-4 py-3 text-center whitespace-nowrap">
                    No.
                    <ColResizeHandle onMouseDown={(e) => startResize(0, e)} />
                  </th>
                  <th className="relative px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>문항 제목 / 내용</span>
                      <button
                        onClick={() => handleSort('sourceOrder')}
                        className="inline-flex items-center text-xs text-gray-400 hover:text-gray-700 transition"
                      >
                        출처순
                        <SortIcon active={sortField === 'sourceOrder'} dir="desc" />
                      </button>
                    </div>
                    <ColResizeHandle onMouseDown={(e) => startResize(1, e)} />
                  </th>
                  <th className="relative px-4 py-3 text-center whitespace-nowrap">
                    유형
                    <ColResizeHandle onMouseDown={(e) => startResize(2, e)} />
                  </th>
                  <th className="relative px-4 py-3 text-center whitespace-nowrap">
                    카테고리
                    <ColResizeHandle onMouseDown={(e) => startResize(3, e)} />
                  </th>
                  <th className="relative px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="inline-flex items-center hover:text-gray-700 transition pr-2"
                    >
                      등록일
                      <SortIcon active={sortField === 'createdAt'} dir={sortDir} />
                    </button>
                    <ColResizeHandle onMouseDown={(e) => startResize(4, e)} />
                  </th>
                  <th className="relative px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => handleSort('updatedAt')}
                      className="inline-flex items-center hover:text-gray-700 transition pr-2"
                    >
                      수정일
                      <SortIcon active={sortField === 'updatedAt'} dir={sortDir} />
                    </button>
                    <ColResizeHandle onMouseDown={(e) => startResize(5, e)} />
                  </th>
                  <th className="relative px-4 py-3 text-center whitespace-nowrap">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paged.map((q, idx) => (
                  <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 text-gray-400 text-center whitespace-nowrap">
                      {page * pageSize + idx + 1}
                    </td>
                    <td className="px-4 py-3.5 text-gray-900 max-w-0">
                      <div>
                        {q.title ? (
                          <p className="truncate font-medium">{q.title}</p>
                        ) : (
                          <p className="truncate text-gray-500">{stripHtml(q.content)}</p>
                        )}
                        {(q.examYear != null || q.examRound != null || q.questionNo != null) ? (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {q.examYear != null ? `${q.examYear}년` : ''}
                            {q.examYear != null && q.examRound != null ? ' ' : ''}
                            {q.examRound != null ? `제${q.examRound}회` : ''}
                            {(q.examYear != null || q.examRound != null) && q.questionNo != null ? ' ' : ''}
                            {q.questionNo != null ? `${q.questionNo}번` : ''}
                          </p>
                        ) : (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100">
                            AI 커스텀
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap overflow-hidden">
                      <span className={[
                        'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                        TYPE_COLOR[q.questionType],
                      ].join(' ')}>
                        {TYPE_LABEL[q.questionType]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap overflow-hidden">
                      {q.categoryName ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          {q.categoryName}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap overflow-hidden">
                      {fmtDate(q.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap overflow-hidden">
                      {q.updatedAt ? fmtDate(q.updatedAt) : '-'}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setDetailQ(q)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 text-xs font-semibold transition whitespace-nowrap"
                        >
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 3C4.5 3 1.5 8 1.5 8s3 5 6.5 5 6.5-5 6.5-5S11.5 3 8 3z" />
                            <circle cx="8" cy="8" r="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          상세
                        </button>
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
            </div>

            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-100">
                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}
