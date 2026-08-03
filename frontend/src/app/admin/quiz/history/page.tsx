'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminQuizHistoryService, type QuizHistoryItem, type QuizHistoryParams } from '@/services/adminQuizHistoryService';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useColumnResize } from '@/lib/useColumnResize';
import { ColResizeHandle } from '@/components/ui/ColResizeHandle';
import { Pagination } from '@/components/ui/Pagination';
import { stripHtml } from '@/lib/html';

const PAGE_SIZE = 20;

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

export default function QuizHistoryPage() {
  const [items, setItems] = useState<QuizHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const [keyword, setKeyword] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'email' | 'domain'>('name');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { widths, startResize } = useColumnResize('tpmp:admin-quiz-history:col-widths:v1', [56, 100, 180, 100, 320, 90, 70, 140, 160]);

  const fetchData = useCallback((params: QuizHistoryParams) => {
    setLoading(true);
    adminQuizHistoryService.getList(params)
      .then((res) => {
        if (res.data.success && res.data.data) {
          const d = res.data.data;
          setItems(d.content);
          setTotalElements(d.totalElements);
          setTotalPages(d.totalPages);
          setCurrentPage(d.page);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData({ page: 0, size: PAGE_SIZE });
  }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData({
      keyword: keyword || undefined,
      type: keyword ? searchType : undefined,
      from: dateFrom || undefined,
      to: dateTo || undefined,
      page: 0,
      size: PAGE_SIZE,
    });
  };

  const handleReset = () => {
    setKeyword('');
    setSearchType('name');
    setDateFrom('');
    setDateTo('');
    fetchData({ page: 0, size: PAGE_SIZE });
  };

  const handlePage = (page: number) => {
    fetchData({
      keyword: keyword || undefined,
      type: keyword ? searchType : undefined,
      from: dateFrom || undefined,
      to: dateTo || undefined,
      page,
      size: PAGE_SIZE,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">퀴즈 풀이 이력</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">사용자의 데일리 퀴즈 풀이 기록입니다.</p>
      </div>

      {/* 검색 필터 */}
      <form onSubmit={handleSearch} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex gap-2">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as 'name' | 'email' | 'domain')}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="name">이름</option>
              <option value="email">이메일</option>
              <option value="domain">도메인</option>
            </select>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="검색어 입력"
              className="w-52 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <span className="text-gray-400 text-sm">~</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors"
            >
              검색
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              초기화
            </button>
          </div>
        </div>
      </form>

      {/* 결과 수 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          총 <span className="font-semibold text-gray-900 dark:text-gray-100">{totalElements.toLocaleString()}</span>건
        </p>
      </div>

      {/* 테이블 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} cols={9} />
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">풀이 이력이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <colgroup>{widths.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider relative">No<ColResizeHandle onMouseDown={(e) => startResize(0, e)} /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider relative">회원 이름<ColResizeHandle onMouseDown={(e) => startResize(1, e)} /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider relative">이메일<ColResizeHandle onMouseDown={(e) => startResize(2, e)} /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider relative">도메인<ColResizeHandle onMouseDown={(e) => startResize(3, e)} /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider relative">문항 내용<ColResizeHandle onMouseDown={(e) => startResize(4, e)} /></th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider relative">유형<ColResizeHandle onMouseDown={(e) => startResize(5, e)} /></th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider relative">정답<ColResizeHandle onMouseDown={(e) => startResize(6, e)} /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider relative">제출 답안<ColResizeHandle onMouseDown={(e) => startResize(7, e)} /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap relative">풀이 일시</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500 tabular-nums">{item.no}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 truncate">{item.userName}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 truncate">{item.userEmail}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 truncate">{item.domainName ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 overflow-hidden truncate" title={item.questionContent ? stripHtml(item.questionContent) : undefined}>
                    {item.questionContent ? stripHtml(item.questionContent) : <span className="text-gray-300 dark:text-gray-600">(삭제된 문항)</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 whitespace-nowrap">{item.questionType}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={[
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      item.correct ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                   : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
                    ].join(' ')}>
                      {item.correct ? '정답' : '오답'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 truncate" title={item.userAnswer ?? undefined}>
                    {item.userAnswer ?? <span className="text-gray-300 dark:text-gray-600">-</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 tabular-nums whitespace-nowrap">{formatDateTime(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      <Pagination page={currentPage} totalPages={totalPages} onChange={handlePage} />
    </div>
  );
}
