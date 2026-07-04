'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminLoginHistoryService, type LoginHistoryItem, type LoginHistoryParams } from '@/services/adminLoginHistoryService';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useColumnResize } from '@/lib/useColumnResize';
import { ColResizeHandle } from '@/components/ui/ColResizeHandle';
import { Pagination } from '@/components/ui/Pagination';

const PAGE_SIZE = 20;

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

export default function LoginHistoryPage() {
  const [items, setItems] = useState<LoginHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState<'name' | 'email' | 'ip'>('name');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // 마지막 컬럼(환경 UA)은 읽기전용이라 폭은 그대로 두고 localStorage 키만 v2로 갱신
  const { widths, startResize } = useColumnResize('tpmp:admin-login-history:col-widths:v2', [56, 120, 180, 140, 160, 240]);

  const fetchData = useCallback((params: LoginHistoryParams) => {
    setLoading(true);
    adminLoginHistoryService.getList(params)
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
      type: keyword ? type : undefined,
      from: from || undefined,
      to: to || undefined,
      page: 0,
      size: PAGE_SIZE,
    });
  };

  const handleReset = () => {
    setKeyword('');
    setType('name');
    setFrom('');
    setTo('');
    fetchData({ page: 0, size: PAGE_SIZE });
  };

  const handlePage = (page: number) => {
    fetchData({
      keyword: keyword || undefined,
      type: keyword ? type : undefined,
      from: from || undefined,
      to: to || undefined,
      page,
      size: PAGE_SIZE,
    });
  };

  return (
    <div className="space-y-4">
      {/* 검색 필터 */}
      <form onSubmit={handleSearch} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'name' | 'email' | 'ip')}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="name">이름</option>
              <option value="email">이메일</option>
              <option value="ip">IP 주소</option>
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
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <span className="text-gray-400 text-sm">~</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
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
          <TableSkeleton rows={8} cols={6} />
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">로그인 이력이 없습니다.</div>
        ) : (
          <table className="w-full text-sm table-fixed">
            <colgroup>{widths.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider relative">No<ColResizeHandle onMouseDown={(e) => startResize(0, e)} /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider relative">이름<ColResizeHandle onMouseDown={(e) => startResize(1, e)} /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider relative">이메일<ColResizeHandle onMouseDown={(e) => startResize(2, e)} /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider relative">IP 주소<ColResizeHandle onMouseDown={(e) => startResize(3, e)} /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider relative">로그인 일시<ColResizeHandle onMouseDown={(e) => startResize(4, e)} /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider relative">환경 (UA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500 tabular-nums">{item.no}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{item.memberName}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.email}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{item.ipAddress}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 tabular-nums whitespace-nowrap">{formatDateTime(item.loginAt)}</td>
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500 overflow-hidden truncate text-xs" title={item.userAgent ?? ''}>
                    {item.userAgent ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이지네이션 */}
      <Pagination page={currentPage} totalPages={totalPages} onChange={handlePage} />
    </div>
  );
}
