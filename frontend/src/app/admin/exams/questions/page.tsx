'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
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

// ── 조회조건 세션 유지 ─────────────────────────────────────────────────────────
// 등록/수정 화면을 다녀와도 조회조건·정렬·페이지가 유지되도록 sessionStorage에 저장한다.
// (탭을 닫으면 초기화 — 오래된 조건이 다음 세션까지 남지 않도록 localStorage가 아닌 sessionStorage 사용)
const SEARCH_STATE_KEY = 'tpmp:admin-questions:search:v1';

interface SavedSearchState {
  keyword: string;
  typeFilter: QuestionType | '';
  categoryFilter: string;
  examTypeFilter: string;
  yearFilter: string;
  roundFilter: string;
  sourceFilter: '' | 'AI_CUSTOM' | 'EXAM';
  usedExamFilter: string;
  usageFilter: '' | 'USED' | 'UNUSED';
  dateFrom: string;
  dateTo: string;
  sortField: SortField;
  sortDir: 'asc' | 'desc';
  page: number;
  pageSize: 10 | 20 | 50;
}

/** sessionStorage에서 조회 상태 복원 — 파싱 실패/미존재/SSR 접근 오류 시 null */
function loadSearchState(): SavedSearchState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SEARCH_STATE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object') return null;
    return parsed as SavedSearchState;
  } catch {
    return null;
  }
}

/** sessionStorage에 조회 상태 저장 — 접근 오류는 무시 */
function saveSearchState(state: SavedSearchState): void {
  try {
    sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(state));
  } catch {
    // 저장 실패 — 무시
  }
}

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
  const [examTypeFilter,   setExamTypeFilter]   = useState('');
  const [yearFilter,       setYearFilter]       = useState('');
  const [roundFilter,      setRoundFilter]      = useState('');
  // 출처: '' = 전체, AI_CUSTOM = 연도·회차 없음, EXAM = 연도 또는 회차 있음 (AI 커스텀 판정 기준과 동일)
  const [sourceFilter,     setSourceFilter]     = useState<'' | 'AI_CUSTOM' | 'EXAM'>('');
  // 사용 시험: 특정 시험명 선택(빈 문자열 = 전체)
  const [usedExamFilter,   setUsedExamFilter]   = useState('');
  // 사용 여부: '' = 전체, USED = 하나 이상 시험에 연결됨, UNUSED = 어느 시험에도 미연결
  const [usageFilter,      setUsageFilter]      = useState<'' | 'USED' | 'UNUSED'>('');
  const [dateFrom,         setDateFrom]         = useState('');
  const [dateTo,           setDateTo]           = useState('');

  // 검색 조건 (적용됨)
  const [appliedKeyword,          setAppliedKeyword]          = useState('');
  const [appliedTypeFilter,       setAppliedTypeFilter]       = useState<QuestionType | ''>('');
  const [appliedCategoryFilter,   setAppliedCategoryFilter]   = useState('');
  const [appliedExamTypeFilter,   setAppliedExamTypeFilter]   = useState('');
  const [appliedYearFilter,       setAppliedYearFilter]       = useState('');
  const [appliedRoundFilter,      setAppliedRoundFilter]      = useState('');
  const [appliedSourceFilter,     setAppliedSourceFilter]     = useState<'' | 'AI_CUSTOM' | 'EXAM'>('');
  const [appliedUsedExamFilter,   setAppliedUsedExamFilter]   = useState('');
  const [appliedUsageFilter,      setAppliedUsageFilter]      = useState<'' | 'USED' | 'UNUSED'>('');
  const [appliedDateFrom,         setAppliedDateFrom]         = useState('');
  const [appliedDateTo,           setAppliedDateTo]           = useState('');

  // 정렬
  const [sortField, setSortField] = useState<SortField>('sourceOrder');
  const [sortDir,   setSortDir]   = useState<'asc' | 'desc'>('desc');

  // 페이지네이션
  const [page,     setPage]     = useState(0);
  const [pageSize, setPageSize] = useState<10 | 20 | 50>(10);

  // 컬럼 드래그 리사이즈 (No. / 문항제목 / 유형 / 카테고리 / 시험유형 / 사용시험 / 등록일 / 수정일 / 관리)
  // 시험유형·사용시험 컬럼 추가로 localStorage 키 v2→v3 갱신(기존 저장값과 컬럼 수 불일치 방지)
  const { widths, startResize } = useColumnResize(
    'tpmp:admin-questions:col-widths:v3',
    [56, 300, 88, 100, 100, 180, 100, 100, 232],
  );

  // 조회 상태 복원 완료 여부 — 복원 전에 기본값으로 저장(덮어쓰기)되는 것을 방지
  const searchStateHydrated = useRef(false);

  // 마운트 시 sessionStorage에서 조회조건·정렬·페이지 복원 (입력값과 적용값을 동일하게 세팅)
  useEffect(() => {
    const s = loadSearchState();
    if (s) {
      setKeyword(s.keyword ?? '');                setAppliedKeyword(s.keyword ?? '');
      setTypeFilter(s.typeFilter ?? '');          setAppliedTypeFilter(s.typeFilter ?? '');
      setCategoryFilter(s.categoryFilter ?? '');  setAppliedCategoryFilter(s.categoryFilter ?? '');
      setExamTypeFilter(s.examTypeFilter ?? '');  setAppliedExamTypeFilter(s.examTypeFilter ?? '');
      setYearFilter(s.yearFilter ?? '');          setAppliedYearFilter(s.yearFilter ?? '');
      setRoundFilter(s.roundFilter ?? '');        setAppliedRoundFilter(s.roundFilter ?? '');
      setSourceFilter(s.sourceFilter ?? '');      setAppliedSourceFilter(s.sourceFilter ?? '');
      setUsedExamFilter(s.usedExamFilter ?? '');  setAppliedUsedExamFilter(s.usedExamFilter ?? '');
      setUsageFilter(s.usageFilter ?? '');        setAppliedUsageFilter(s.usageFilter ?? '');
      setDateFrom(s.dateFrom ?? '');              setAppliedDateFrom(s.dateFrom ?? '');
      setDateTo(s.dateTo ?? '');                  setAppliedDateTo(s.dateTo ?? '');
      if (s.sortField) setSortField(s.sortField);
      if (s.sortDir) setSortDir(s.sortDir);
      if (typeof s.page === 'number' && s.page >= 0) setPage(s.page);
      if (s.pageSize === 10 || s.pageSize === 20 || s.pageSize === 50) setPageSize(s.pageSize);
    }
    searchStateHydrated.current = true;
  }, []);

  // 적용된 조회조건·정렬·페이지 변경 시마다 저장 (복원 완료 후에만)
  useEffect(() => {
    if (!searchStateHydrated.current) return;
    saveSearchState({
      keyword: appliedKeyword,
      typeFilter: appliedTypeFilter,
      categoryFilter: appliedCategoryFilter,
      examTypeFilter: appliedExamTypeFilter,
      yearFilter: appliedYearFilter,
      roundFilter: appliedRoundFilter,
      sourceFilter: appliedSourceFilter,
      usedExamFilter: appliedUsedExamFilter,
      usageFilter: appliedUsageFilter,
      dateFrom: appliedDateFrom,
      dateTo: appliedDateTo,
      sortField,
      sortDir,
      page,
      pageSize,
    });
  }, [appliedKeyword, appliedTypeFilter, appliedCategoryFilter, appliedExamTypeFilter, appliedYearFilter, appliedRoundFilter, appliedSourceFilter, appliedUsedExamFilter, appliedUsageFilter, appliedDateFrom, appliedDateTo, sortField, sortDir, page, pageSize]);

  useEffect(() => {
    // 고정 size로는 총 문항 수가 그 값을 넘으면 뒤 페이지가 누락된다(전체 로드 후 클라이언트에서
    // 필터·정렬하는 화면 구조라 totalPages만큼 순회해 전체를 모은다).
    const PAGE_FETCH_SIZE = 500;
    (async () => {
      try {
        const first = await examService.adminGetQuestions(0, PAGE_FETCH_SIZE);
        const totalPages = first.data.data?.totalPages ?? 1;
        const pages = [first.data.data?.content ?? []];
        for (let p = 1; p < totalPages; p++) {
          const res = await examService.adminGetQuestions(p, PAGE_FETCH_SIZE);
          pages.push(res.data.data?.content ?? []);
        }
        setAllQuestions(pages.flat());
      } catch {
        setError('문항 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    })();
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
    setAppliedExamTypeFilter(examTypeFilter);
    setAppliedYearFilter(yearFilter);
    setAppliedRoundFilter(roundFilter);
    setAppliedSourceFilter(sourceFilter);
    setAppliedUsedExamFilter(usedExamFilter);
    setAppliedUsageFilter(usageFilter);
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

  // 시험 유형(examTypeName) 옵션 — 정보처리기사 실기 / SQLD / 리눅스마스터 1급·2급 등
  const examTypeOptions = useMemo(() => {
    const names = allQuestions
      .map((q) => q.examTypeName ?? null)
      .filter((n): n is string => n !== null && n.trim() !== '');
    return Array.from(new Set(names)).sort();
  }, [allQuestions]);

  // 사용 시험(usedInExams) 옵션 — 실제 시험지에 연결되어 사용 중인 시험 제목 전체
  const usedExamOptions = useMemo(() => {
    const names = allQuestions.flatMap((q) => q.usedInExams ?? []);
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
        const inTitle = q.title?.toLowerCase().includes(kw) ?? false;
        if (!inTitle) return false;
      }
      if (appliedTypeFilter && q.questionType !== appliedTypeFilter) return false;
      if (appliedCategoryFilter !== '') {
        if (appliedCategoryFilter === '__UNCATEGORIZED__') {
          if (q.categoryName) return false;
        } else {
          if (q.categoryName !== appliedCategoryFilter) return false;
        }
      }
      if (appliedExamTypeFilter !== '' && q.examTypeName !== appliedExamTypeFilter) return false;
      if (appliedYearFilter  !== '' && q.examYear  !== Number(appliedYearFilter))  return false;
      if (appliedRoundFilter !== '' && q.examRound !== Number(appliedRoundFilter)) return false;
      // 출처 필터 — AI 커스텀 판정은 연도·회차 없음 기준(문항번호 무관)
      const isAiCustom = q.examYear == null && q.examRound == null;
      if (appliedSourceFilter === 'AI_CUSTOM' && !isAiCustom) return false;
      if (appliedSourceFilter === 'EXAM' && isAiCustom) return false;
      // 사용 시험 필터 — 특정 시험명 선택 시 해당 시험에 연결된 문항만
      const usedInExams = q.usedInExams ?? [];
      if (appliedUsedExamFilter !== '' && !usedInExams.includes(appliedUsedExamFilter)) return false;
      // 사용 여부 필터 — 하나 이상 시험에 연결됐는지
      if (appliedUsageFilter === 'USED'   && usedInExams.length === 0) return false;
      if (appliedUsageFilter === 'UNUSED' && usedInExams.length > 0)  return false;
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
  }, [allQuestions, appliedKeyword, appliedTypeFilter, appliedCategoryFilter, appliedExamTypeFilter, appliedYearFilter, appliedRoundFilter, appliedSourceFilter, appliedUsedExamFilter, appliedUsageFilter, appliedDateFrom, appliedDateTo, sortField, sortDir]);

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
            <label className="block text-xs font-medium text-gray-500 mb-1">문항 제목</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="문항 제목 검색"
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

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">시험 유형</label>
            <select
              value={examTypeFilter}
              onChange={(e) => setExamTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            >
              <option value="">전체</option>
              {examTypeOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">사용 시험</label>
            <select
              value={usedExamFilter}
              onChange={(e) => setUsedExamFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            >
              <option value="">전체</option>
              {usedExamOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="w-28">
            <label className="block text-xs font-medium text-gray-500 mb-1">사용 여부</label>
            <select
              value={usageFilter}
              onChange={(e) => setUsageFilter(e.target.value as '' | 'USED' | 'UNUSED')}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            >
              <option value="">전체</option>
              <option value="USED">사용중</option>
              <option value="UNUSED">미사용</option>
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

          <div className="w-28">
            <label className="block text-xs font-medium text-gray-500 mb-1">출처</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as '' | 'AI_CUSTOM' | 'EXAM')}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            >
              <option value="">전체</option>
              <option value="EXAM">기출</option>
              <option value="AI_CUSTOM">AI 커스텀</option>
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

          {(keyword || typeFilter || categoryFilter || examTypeFilter || yearFilter || roundFilter || sourceFilter || usedExamFilter || usageFilter || dateFrom || dateTo ||
            appliedKeyword || appliedTypeFilter || appliedCategoryFilter || appliedExamTypeFilter || appliedYearFilter || appliedRoundFilter || appliedSourceFilter || appliedUsedExamFilter || appliedUsageFilter || appliedDateFrom || appliedDateTo) && (
            <button
              onClick={() => {
                setKeyword(''); setTypeFilter(''); setCategoryFilter(''); setExamTypeFilter(''); setYearFilter(''); setRoundFilter(''); setSourceFilter(''); setUsedExamFilter(''); setUsageFilter(''); setDateFrom(''); setDateTo('');
                setAppliedKeyword(''); setAppliedTypeFilter(''); setAppliedCategoryFilter(''); setAppliedExamTypeFilter(''); setAppliedYearFilter(''); setAppliedRoundFilter(''); setAppliedSourceFilter(''); setAppliedUsedExamFilter(''); setAppliedUsageFilter(''); setAppliedDateFrom(''); setAppliedDateTo('');
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
          <TableSkeleton rows={5} cols={9} />
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
                  <th className="relative px-4 py-3 text-center whitespace-nowrap">
                    시험 유형
                    <ColResizeHandle onMouseDown={(e) => startResize(4, e)} />
                  </th>
                  <th className="relative px-4 py-3 text-center whitespace-nowrap">
                    사용 시험
                    <ColResizeHandle onMouseDown={(e) => startResize(5, e)} />
                  </th>
                  <th className="relative px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="inline-flex items-center hover:text-gray-700 transition pr-2"
                    >
                      등록일
                      <SortIcon active={sortField === 'createdAt'} dir={sortDir} />
                    </button>
                    <ColResizeHandle onMouseDown={(e) => startResize(6, e)} />
                  </th>
                  <th className="relative px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => handleSort('updatedAt')}
                      className="inline-flex items-center hover:text-gray-700 transition pr-2"
                    >
                      수정일
                      <SortIcon active={sortField === 'updatedAt'} dir={sortDir} />
                    </button>
                    <ColResizeHandle onMouseDown={(e) => startResize(7, e)} />
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
                        {/* AI 커스텀 판정은 연도·회차 없음 기준 — 문항번호는 AI 커스텀도 정렬용으로 가질 수 있다 */}
                        {(q.examYear != null || q.examRound != null) ? (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {q.examYear != null ? `${q.examYear}년` : ''}
                            {q.examYear != null && q.examRound != null ? ' ' : ''}
                            {q.examRound != null ? `제${q.examRound}회` : ''}
                            {q.questionNo != null ? ` ${q.questionNo}번` : ''}
                          </p>
                        ) : (
                          <p className="mt-0.5 flex items-center gap-1.5">
                            <span className="inline-block px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100">
                              AI 커스텀
                            </span>
                            {q.questionNo != null && (
                              <span className="text-xs text-slate-400">{q.questionNo}번</span>
                            )}
                          </p>
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
                    <td className="px-4 py-3.5 text-center whitespace-nowrap overflow-hidden">
                      {q.examTypeName ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-600">
                          {q.examTypeName}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center overflow-hidden">
                      {q.usedInExams && q.usedInExams.length > 0 ? (
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          {q.usedInExams.map((title) => (
                            <span
                              key={title}
                              title={title}
                              className="inline-block max-w-[160px] truncate px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600"
                            >
                              {title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">미사용</span>
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
