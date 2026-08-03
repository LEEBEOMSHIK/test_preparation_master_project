'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  adminQuizHistoryService,
  type QuizHistoryItem,
  type QuizHistoryParams,
  type QuizDomainStat,
} from '@/services/adminQuizHistoryService';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useColumnResize } from '@/lib/useColumnResize';
import { ColResizeHandle } from '@/components/ui/ColResizeHandle';
import { Pagination } from '@/components/ui/Pagination';
import { stripHtml } from '@/lib/html';

const PAGE_SIZE = 20;

const TYPE_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE: '객관식',
  SHORT_ANSWER: '주관식',
  OX: 'O/X',
  CODE: '코드',
  SCHEDULING: '스케줄링',
  SQL: 'SQL',
};

const TYPE_COLOR: Record<string, string> = {
  MULTIPLE_CHOICE: 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  SHORT_ANSWER:    'bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-400',
  OX:              'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  CODE:            'bg-violet-50 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
  SCHEDULING:      'bg-teal-50 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400',
  SQL:             'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400',
};

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

  const [domainStats, setDomainStats] = useState<QuizDomainStat[]>([]);
  const [domainStatsLoading, setDomainStatsLoading] = useState(true);

  const [keyword, setKeyword] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'email' | 'domain'>('name');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { widths, startResize } = useColumnResize('tpmp:admin-quiz-history:col-widths:v2', [56, 90, 170, 110, 300, 100, 70, 130, 150]);

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

  const fetchDomainStats = useCallback((from?: string, to?: string) => {
    setDomainStatsLoading(true);
    adminQuizHistoryService.getDomainStats({ from, to })
      .then((res) => {
        if (res.data.success && res.data.data) {
          setDomainStats(res.data.data);
        }
      })
      .catch(() => {})
      .finally(() => setDomainStatsLoading(false));
  }, []);

  useEffect(() => {
    fetchData({ page: 0, size: PAGE_SIZE });
    fetchDomainStats(undefined, undefined);
  }, [fetchData, fetchDomainStats]);

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
    fetchDomainStats(dateFrom || undefined, dateTo || undefined);
  };

  const handleReset = () => {
    setKeyword('');
    setSearchType('name');
    setDateFrom('');
    setDateTo('');
    fetchData({ page: 0, size: PAGE_SIZE });
    fetchDomainStats(undefined, undefined);
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

  const domainChartData = [...domainStats]
    .sort((a, b) => a.totalQuestions - b.totalQuestions) // recharts vertical layout renders top-down bottom-up
    .map((d) => ({ name: d.domainName, count: d.totalQuestions }));
  const domainMaxCount = domainChartData.reduce((max, d) => Math.max(max, d.count), 1);

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

      {/* 도메인(카테고리)별 풀이량 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
          도메인별 풀이량 {dateFrom || dateTo ? '(조회 기간 기준)' : '(전체 기간)'}
        </p>
        {domainStatsLoading ? (
          <div className="h-40 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg" />
        ) : domainChartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">집계할 풀이 이력이 없습니다.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(160, domainChartData.length * 36)}>
            <BarChart
              layout="vertical"
              data={domainChartData}
              margin={{ left: 8, right: 24, top: 0, bottom: 0 }}
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
              <XAxis
                type="number"
                domain={[0, domainMaxCount]}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
                formatter={(v) => [typeof v === 'number' ? `${v}문제` : '', '풀이 수']}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider relative overflow-hidden">No<ColResizeHandle onMouseDown={(e) => startResize(0, e)} /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider relative overflow-hidden">회원 이름<ColResizeHandle onMouseDown={(e) => startResize(1, e)} /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider relative overflow-hidden">이메일<ColResizeHandle onMouseDown={(e) => startResize(2, e)} /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider relative overflow-hidden">도메인<ColResizeHandle onMouseDown={(e) => startResize(3, e)} /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider relative overflow-hidden">문항 내용<ColResizeHandle onMouseDown={(e) => startResize(4, e)} /></th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider relative overflow-hidden">유형<ColResizeHandle onMouseDown={(e) => startResize(5, e)} /></th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider relative overflow-hidden">정답<ColResizeHandle onMouseDown={(e) => startResize(6, e)} /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider relative overflow-hidden">제출 답안<ColResizeHandle onMouseDown={(e) => startResize(7, e)} /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap relative overflow-hidden">풀이 일시</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500 tabular-nums overflow-hidden truncate">{item.no}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 overflow-hidden truncate" title={item.userName}>{item.userName}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 overflow-hidden truncate" title={item.userEmail}>{item.userEmail}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 overflow-hidden truncate" title={item.domainName ?? undefined}>{item.domainName ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 overflow-hidden truncate" title={item.questionContent ? stripHtml(item.questionContent) : undefined}>
                    {item.questionContent ? stripHtml(item.questionContent) : <span className="text-gray-300 dark:text-gray-600">(삭제된 문항)</span>}
                  </td>
                  <td className="px-4 py-3 text-center overflow-hidden">
                    <span className={[
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
                      TYPE_COLOR[item.questionType] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                    ].join(' ')}>
                      {TYPE_LABEL[item.questionType] ?? item.questionType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center overflow-hidden">
                    <span className={[
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
                      item.correct ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                   : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
                    ].join(' ')}>
                      {item.correct ? '정답' : '오답'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 overflow-hidden truncate" title={item.userAnswer ?? undefined}>
                    {item.userAnswer ?? <span className="text-gray-300 dark:text-gray-600">-</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 tabular-nums whitespace-nowrap overflow-hidden">{formatDateTime(item.createdAt)}</td>
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
