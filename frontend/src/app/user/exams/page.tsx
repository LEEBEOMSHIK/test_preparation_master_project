'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { examinationService } from '@/services/examinationService';
import { quoteService } from '@/services/quoteService';
import { CardListSkeleton } from '@/components/ui/Skeleton';
import type { Examination, Quote } from '@/types';

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export default function UserExamsPage() {
  const router = useRouter();
  const [allExams, setAllExams] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [showQuote, setShowQuote] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);
  const quoteFetched = useRef(false);

  const [searchTitle, setSearchTitle] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<PageSize>(20);
  const [selectedExam, setSelectedExam] = useState<Examination | null>(null);

  const STORAGE_KEY = 'tpmp_quote_hidden_until';

  useEffect(() => {
    const hiddenUntil = Number(localStorage.getItem(STORAGE_KEY) ?? '0');
    const isHidden = hiddenUntil > Date.now();

    Promise.all([
      examinationService.userGetExaminations(0, 500),
      !quoteFetched.current && !isHidden ? quoteService.getRandom() : Promise.resolve(null),
    ]).then(([examRes, quoteRes]) => {
      if (examRes.data.success && examRes.data.data) {
        setAllExams(examRes.data.data.content);
      }
      if (quoteRes && quoteRes.data.success && quoteRes.data.data) {
        setQuote(quoteRes.data.data);
        setShowQuote(true);
        quoteFetched.current = true;
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleCloseQuote = () => {
    if (dontShowToday) localStorage.setItem(STORAGE_KEY, String(Date.now() + 86_400_000));
    setShowQuote(false);
  };

  const categories = Array.from(new Set(allExams.map(e => e.categoryName).filter(Boolean)));

  const filteredExams = allExams.filter(exam => {
    const titleMatch = !searchTitle.trim() || exam.title.toLowerCase().includes(searchTitle.toLowerCase());
    const categoryMatch = filterCategory === 'ALL' || exam.categoryName === filterCategory;
    return titleMatch && categoryMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredExams.length / pageSize));
  const pagedExams = filteredExams.slice(page * pageSize, (page + 1) * pageSize);

  const resetPage = () => setPage(0);

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
              <h3 className="text-lg font-bold text-gray-900">{selectedExam.title}</h3>
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

      <div>
        <h2 className="text-xl font-semibold text-gray-900">시험 목록</h2>
        <p className="text-sm text-gray-500 mt-1">응시 가능한 시험 목록입니다.</p>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={searchTitle}
          onChange={e => { setSearchTitle(e.target.value); resetPage(); }}
          placeholder="시험 제목 검색..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <select
          value={filterCategory}
          onChange={e => { setFilterCategory(e.target.value); resetPage(); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        >
          <option value="ALL">전체 유형</option>
          {categories.map(c => <option key={c} value={c!}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <CardListSkeleton rows={6} />
      ) : filteredExams.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-400 text-sm">
          {allExams.length === 0 ? '등록된 시험이 없습니다.' : '검색 조건에 맞는 시험이 없습니다.'}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              총 <span className="font-semibold text-gray-900">{filteredExams.length}</span>건
              {(searchTitle || filterCategory !== 'ALL') && (
                <span className="ml-1 text-indigo-500 text-xs">(필터 적용)</span>
              )}
            </p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400 mr-1">표시</span>
              {PAGE_SIZE_OPTIONS.map(s => (
                <button key={s} onClick={() => { setPageSize(s); setPage(0); }}
                  className={[
                    'px-2.5 py-1 text-xs rounded-lg border transition',
                    pageSize === s ? 'bg-indigo-600 text-white border-indigo-600' : 'text-gray-600 border-gray-300 hover:border-indigo-400',
                  ].join(' ')}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {pagedExams.map(exam => (
              <button key={exam.id} onClick={() => setSelectedExam(exam)}
                className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between hover:border-indigo-400 hover:shadow-md transition group text-left w-full">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 group-hover:text-indigo-700 transition truncate">
                    {exam.title}
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition">
                이전
              </button>
              <span className="text-sm text-gray-500">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition">
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
