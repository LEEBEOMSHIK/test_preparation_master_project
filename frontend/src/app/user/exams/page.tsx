'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { examinationService } from '@/services/examinationService';
import type { UserExaminationFilterOptions, UserExaminationSearchOptions } from '@/services/examinationService';
import { examInfoService } from '@/services/examInfoService';
import type { ExamTypeOption } from '@/services/examInfoService';
import { quoteService } from '@/services/quoteService';
import { useAuthStore } from '@/store/authStore';
import { CardListSkeleton } from '@/components/ui/Skeleton';
import { ListPagination } from '@/components/ui/ListPagination';
import { ApiApplicationError, extractApiErrorMessage } from '@/lib/apiError';
import type { Examination, Quote } from '@/types';

const EXAM_LIST_ID = 'user-examination-list';

export default function UserExamsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [exams, setExams] = useState<Examination[]>([]);
  const [examTypes, setExamTypes] = useState<ExamTypeOption[]>([]);
  const [filterOptions, setFilterOptions] = useState<UserExaminationFilterOptions>({ years: [], rounds: [] });
  const [filterMetadataError, setFilterMetadataError] = useState<string | null>(null);
  const [filterMetadataRetryKey, setFilterMetadataRetryKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [showQuote, setShowQuote] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);
  const quoteFetched = useRef(false);

  const [searchTitle, setSearchTitle] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');
  const [filterRound, setFilterRound] = useState('ALL');
  const [filterAiCustom, setFilterAiCustom] = useState<'ALL' | 'ORIGINAL' | 'AI_CUSTOM'>('ALL');
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [showAllExams, setShowAllExams] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedExam, setSelectedExam] = useState<Examination | null>(null);
  const requestIdRef = useRef(0);

  const STORAGE_KEY = 'tpmp_quote_hidden_until';

  useEffect(() => {
    let cancelled = false;
    setFilterMetadataError(null);
    void Promise.all([
      examInfoService.getExamTypes(),
      examinationService.userGetExaminationFilters(),
    ]).then(([typesRes, filtersRes]) => {
      if (!typesRes.data.success || !typesRes.data.data) {
        throw new ApiApplicationError(typesRes.data.error?.message ?? '필터 정보를 불러오지 못했습니다.');
      }
      if (!filtersRes.data.success || !filtersRes.data.data) {
        throw new ApiApplicationError(filtersRes.data.error?.message ?? '필터 정보를 불러오지 못했습니다.');
      }
      if (!cancelled) {
        setExamTypes(typesRes.data.data);
        setFilterOptions(filtersRes.data.data);
      }
    }).catch(cause => {
      if (!cancelled) {
        setFilterMetadataError(extractApiErrorMessage(cause, '필터 정보를 불러오지 못했습니다.'));
      }
    });

    return () => { cancelled = true; };
  }, [filterMetadataRetryKey]);

  useEffect(() => {
    let cancelled = false;
    const hiddenUntil = Number(localStorage.getItem(STORAGE_KEY) ?? '0');
    const isHidden = hiddenUntil > Date.now();

    if (!quoteFetched.current && !isHidden) {
      void quoteService.getRandom().then(quoteRes => {
        if (cancelled || !quoteRes.data.success || !quoteRes.data.data) return;
        setQuote(quoteRes.data.data);
        setShowQuote(true);
        quoteFetched.current = true;
      }).catch(() => undefined);
    }

    return () => { cancelled = true; };
  }, []);

  const handleCloseQuote = () => {
    if (dontShowToday) localStorage.setItem(STORAGE_KEY, String(Date.now() + 86_400_000));
    setShowQuote(false);
  };

  const interestedNames = user?.interestedExamTypes ?? [];
  const hasInterests = interestedNames.length > 0;
  const interestKey = interestedNames.join('\u0000');
  const previousInterestKeyRef = useRef(interestKey);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const interestsChanged = previousInterestKeyRef.current !== interestKey;
    previousInterestKeyRef.current = interestKey;
    if (interestsChanged && page !== 0) {
      setPage(0);
      return;
    }
    const filters: UserExaminationSearchOptions = {};
    const normalizedTitle = searchTitle.trim();
    if (normalizedTitle) filters.title = normalizedTitle;
    if (filterCategory !== 'ALL') filters.category = filterCategory;
    if (!showAllExams && hasInterests) filters.interests = interestedNames;
    if (filterYear !== 'ALL') filters.year = Number(filterYear);
    if (filterRound !== 'ALL') filters.round = Number(filterRound);
    if (filterAiCustom !== 'ALL') filters.aiCustom = filterAiCustom === 'AI_CUSTOM';

    setLoading(true);
    setError(null);
    void examinationService.userGetExaminations(page, pageSize, filters)
      .then(response => {
        if (requestId !== requestIdRef.current) return;
        if (!response.data.success || !response.data.data) {
          throw new ApiApplicationError(response.data.error?.message ?? '시험 목록을 불러오지 못했습니다.');
        }
        const result = response.data.data;
        const lastPage = Math.max(0, result.totalPages - 1);
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }
        setExams(result.content);
        setTotalElements(result.totalElements);
        setTotalPages(result.totalPages);
      })
      .catch(cause => {
        if (requestId !== requestIdRef.current) return;
        setExams([]);
        setTotalElements(0);
        setTotalPages(0);
        setError(extractApiErrorMessage(cause, '시험 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'));
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
  }, [
    page,
    pageSize,
    searchTitle,
    filterCategory,
    filterYear,
    filterRound,
    filterAiCustom,
    showAllExams,
    hasInterests,
    interestKey,
    retryKey,
  ]);

  const comboOptions = (!showAllExams && hasInterests)
    ? examTypes.filter(t => interestedNames.includes(t.name))
    : examTypes;

  const yearOptions = filterOptions.years;
  const roundOptions = filterOptions.rounds;

  const activeFilterCount = [
    filterCategory !== 'ALL',
    filterYear !== 'ALL',
    filterRound !== 'ALL',
    filterAiCustom !== 'ALL',
  ].filter(Boolean).length;

  const resetPage = () => setPage(0);

  const handleToggleShowAll = () => {
    setShowAllExams(v => !v);
    setFilterCategory('ALL');
    resetPage();
  };

  const hasAppliedFilters = Boolean(
    searchTitle.trim() ||
    filterCategory !== 'ALL' ||
    filterYear !== 'ALL' ||
    filterRound !== 'ALL' ||
    filterAiCustom !== 'ALL' ||
    (!showAllExams && hasInterests)
  );

  return (
    <div className="space-y-4">
      {/* 랜덤 명언 모달 */}
      {showQuote && quote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-7 text-center space-y-4">
            <div className="w-10 h-10 mx-auto rounded-full bg-indigo-50 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-indigo-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <p className="text-gray-800 font-medium text-base leading-relaxed">&ldquo;{quote.content}&rdquo;</p>
            {quote.author && <p className="text-sm text-gray-400">— {quote.author}</p>}
            <label className="flex items-center justify-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
              <input type="checkbox" checked={dontShowToday} onChange={e => setDontShowToday(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              하루 동안 보지 않기
            </label>
            <button onClick={handleCloseQuote}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition">
              오늘도 화이팅!
            </button>
          </div>
        </div>
      )}

      {/* 시험 시작 팝업 */}
      {selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-7 space-y-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
                <span>{selectedExam.title}</span>
                {selectedExam.isAiCustom && (
                  <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                    AI 커스텀
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500 mt-1">시험을 시작하기 전 정보를 확인해 주세요.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">시험지</span>
                <span className="font-medium text-gray-900">{selectedExam.examPaperTitle}</span>
              </div>
              {selectedExam.categoryName && (
                <div className="flex justify-between">
                  <span className="text-gray-500">시험 유형</span>
                  <span className="font-medium text-gray-900">{selectedExam.categoryName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">제한 시간</span>
                <span className="font-medium text-gray-900">{selectedExam.timeLimit}분</span>
              </div>
            </div>
            {selectedExam.isAiCustom && (
              <p className="text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-2 leading-relaxed">
                정보처리기사 실기 시험의 출제 범위와 최신 출제 경향을 참고하여 AI가 새로 구성한 모의고사입니다. 실제 기출문제를 사용하지 않았습니다.
              </p>
            )}
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              시험 도중 브라우저를 닫거나 뒤로가기 시 모든 답안이 초기화됩니다.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setSelectedExam(null)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition">
                취소
              </button>
              <button onClick={() => router.push(`/exam/${selectedExam.id}`)}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition">
                시험 시작
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">시험 목록</h2>
          <p className="text-sm text-gray-500 mt-1">응시 가능한 시험 목록입니다.</p>
        </div>
        {hasInterests && (
          <button
            onClick={handleToggleShowAll}
            className={[
              'text-xs px-3 py-1.5 rounded-full border transition',
              showAllExams
                ? 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                : 'bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-100',
            ].join(' ')}
          >
            {showAllExams ? '관심 유형만 보기' : '전체 보기'}
          </button>
        )}
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 sm:flex-1">
          <input
            type="text"
            value={searchTitle}
            onChange={e => { setSearchTitle(e.target.value); resetPage(); }}
            placeholder="시험 제목 검색..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="button"
            onClick={() => setFilterExpanded(v => !v)}
            aria-expanded={filterExpanded}
            className={[
              'sm:hidden shrink-0 flex items-center gap-1 text-xs px-3 py-2 rounded-lg border transition',
              filterExpanded
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
            ].join(' ')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M6 12h12M10 20h4" />
            </svg>
            필터
            {activeFilterCount > 0 && (
              <span className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-semibold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
        <div
          className={[
            filterExpanded ? 'grid grid-cols-2' : 'hidden',
            'gap-2 sm:flex sm:flex-row sm:gap-3',
          ].join(' ')}
        >
          <select
            aria-label="시험 유형"
            value={filterCategory}
            onChange={e => { setFilterCategory(e.target.value); resetPage(); }}
            className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          >
            <option value="ALL">전체 유형</option>
            {comboOptions.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
          <select
            aria-label="시험 연도"
            value={filterYear}
            onChange={e => { setFilterYear(e.target.value); resetPage(); }}
            className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          >
            <option value="ALL">전체 연도</option>
            {yearOptions.map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
          <select
            aria-label="시험 회차"
            value={filterRound}
            onChange={e => { setFilterRound(e.target.value); resetPage(); }}
            className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          >
            <option value="ALL">전체 회차</option>
            {roundOptions.map(r => <option key={r} value={r}>{r}회</option>)}
          </select>
          <select
            aria-label="시험 출처"
            value={filterAiCustom}
            onChange={e => { setFilterAiCustom(e.target.value as 'ALL' | 'ORIGINAL' | 'AI_CUSTOM'); resetPage(); }}
            className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          >
            <option value="ALL">전체</option>
            <option value="ORIGINAL">기출</option>
            <option value="AI_CUSTOM">AI 커스텀</option>
          </select>
        </div>
      </div>

      {filterMetadataError && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">{filterMetadataError}</p>
          <button
            type="button"
            onClick={() => setFilterMetadataRetryKey(value => value + 1)}
            className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
          >
            필터 다시 시도
          </button>
        </div>
      )}

      <div id={EXAM_LIST_ID} className="scroll-mt-24 space-y-4">
        {loading ? (
          <CardListSkeleton rows={5} />
        ) : error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => setRetryKey(value => value + 1)}
              className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-100"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <>
            {exams.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-400 text-sm">
                {hasAppliedFilters ? '검색 조건에 맞는 시험이 없습니다.' : '등록된 시험이 없습니다.'}
              </div>
            ) : (
              <div className="grid gap-3">
                {exams.map(exam => (
              <button key={exam.id} onClick={() => setSelectedExam(exam)}
                className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between hover:border-indigo-400 hover:shadow-md transition group text-left w-full">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 group-hover:text-indigo-700 transition truncate flex items-center gap-1.5">
                    <span className="truncate">{exam.title}</span>
                    {exam.isAiCustom && (
                      <span
                        className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200"
                        title="정보처리기사 실기 시험의 출제 범위와 최신 출제 경향을 참고하여 AI가 새로 구성한 모의고사입니다. 실제 기출문제를 사용하지 않았습니다."
                      >
                        AI 커스텀
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {exam.examPaperTitle}
                    {exam.categoryName && <> &middot; {exam.categoryName}</>}
                    &nbsp;&middot; 제한 {exam.timeLimit}분
                  </p>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                  className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 shrink-0 ml-4 transition">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
                ))}
              </div>
            )}
            <ListPagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              onChange={setPage}
              onPageSizeChange={nextPageSize => {
                setPageSize(nextPageSize);
                setPage(0);
              }}
              scrollTargetId={EXAM_LIST_ID}
            />
          </>
        )}
      </div>
    </div>
  );
}
