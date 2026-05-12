'use client';

import { useEffect, useRef, useState } from 'react';
import { practiceAdminService, type PracticeHistoryItem } from '@/services/practiceAdminService';
import { TableSkeleton } from '@/components/ui/Skeleton';

const RESULT_TYPES = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'ERROR'];

const DIALECT_STYLE: Record<string, { label: string; cls: string }> = {
  postgresql: { label: 'PostgreSQL', cls: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
  mysql:      { label: 'MySQL',      cls: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  oracle:     { label: 'Oracle',     cls: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
};

const RESULT_TYPE_STYLE: Record<string, string> = {
  SELECT:  'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  INSERT:  'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  UPDATE:  'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  DELETE:  'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  CREATE:  'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  DROP:    'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  ALTER:   'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  ERROR:   'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
  DML:     'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export default function PracticeHistoryPage() {
  const [items, setItems] = useState<PracticeHistoryItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // 필터 상태
  const [emailInput, setEmailInput] = useState('');
  const [sqlInput, setSqlInput] = useState('');
  const [resultTypeFilter, setResultTypeFilter] = useState('');
  const [dialectFilter, setDialectFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // 실제 적용된 필터 (debounce 이후)
  const [appliedEmail, setAppliedEmail] = useState('');
  const [appliedSql, setAppliedSql] = useState('');

  const emailDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sqlDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const PAGE_SIZE = 20;

  useEffect(() => {
    setLoading(true);
    practiceAdminService.getHistory(page, PAGE_SIZE, {
      email: appliedEmail || undefined,
      sqlContent: appliedSql || undefined,
      resultType: resultTypeFilter || undefined,
      dialect: dialectFilter || undefined,
      date: dateFilter || undefined,
    })
      .then(res => {
        if (res.data.success && res.data.data) {
          const d = res.data.data;
          setItems(d.content);
          setTotalElements(d.totalElements);
          setTotalPages(d.totalPages);
        }
      })
      .finally(() => setLoading(false));
  }, [page, appliedEmail, appliedSql, resultTypeFilter, dialectFilter, dateFilter]);

  const handleEmailChange = (value: string) => {
    setEmailInput(value);
    if (emailDebounce.current) clearTimeout(emailDebounce.current);
    emailDebounce.current = setTimeout(() => { setPage(0); setAppliedEmail(value); }, 400);
  };

  const handleSqlChange = (value: string) => {
    setSqlInput(value);
    if (sqlDebounce.current) clearTimeout(sqlDebounce.current);
    sqlDebounce.current = setTimeout(() => { setPage(0); setAppliedSql(value); }, 400);
  };

  const handleResultTypeChange = (value: string) => {
    setResultTypeFilter(value);
    setPage(0);
  };

  const handleDialectChange = (value: string) => {
    setDialectFilter(value);
    setPage(0);
  };

  const handleDateChange = (value: string) => {
    setDateFilter(value);
    setPage(0);
  };

  const hasActiveFilter = appliedEmail || appliedSql || resultTypeFilter || dialectFilter || dateFilter;

  const clearFilters = () => {
    setEmailInput(''); setAppliedEmail('');
    setSqlInput(''); setAppliedSql('');
    setResultTypeFilter('');
    setDialectFilter('');
    setDateFilter('');
    setPage(0);
  };

  const badge = (type: string) => {
    const cls = RESULT_TYPE_STYLE[type] ?? RESULT_TYPE_STYLE.DML;
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${cls}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">기록 관리</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            사용자 연습장 SQL 실행 기록 {totalElements > 0 && `(총 ${totalElements.toLocaleString()}건)`}
          </p>
        </div>
        {hasActiveFilter && (
          <button
            onClick={clearFilters}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            필터 초기화
          </button>
        )}
      </div>

      {/* 필터 영역 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* 이메일 검색 */}
          <div className="relative flex-1 min-w-[160px]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="이메일 검색"
              value={emailInput}
              onChange={e => handleEmailChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* SQL 내용 검색 */}
          <div className="relative flex-1 min-w-[180px]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <input
              type="text"
              placeholder="SQL 내용 검색"
              value={sqlInput}
              onChange={e => handleSqlChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* 결과 유형 */}
          <select
            value={resultTypeFilter}
            onChange={e => handleResultTypeChange(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">결과 유형 전체</option>
            {RESULT_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* DB 종류 */}
          <select
            value={dialectFilter}
            onChange={e => handleDialectChange(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">DB 종류 전체</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="oracle">Oracle</option>
          </select>

          {/* 실행 날짜 */}
          <input
            type="date"
            value={dateFilter}
            onChange={e => handleDateChange(e.target.value)}
            title="실행 날짜 (yyyy-mm-dd)"
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">
            {hasActiveFilter ? '검색 조건에 해당하는 기록이 없습니다.' : '실행 기록이 없습니다.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-12">순번</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">이메일</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">SQL 내용</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-24">결과 유형</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-28">DB 종류</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-16">행 수</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-40">실행 시각</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map((item, idx) => {
                const seqNo = page * PAGE_SIZE + idx + 1;
                const dialectInfo = DIALECT_STYLE[item.dialect] ?? DIALECT_STYLE.postgresql;
                return (
                <>
                  <tr
                    key={item.id}
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-3 text-center text-xs text-gray-400 dark:text-gray-500 tabular-nums">{seqNo}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-mono text-xs">{item.userEmail}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs">
                      <code className="block truncate text-xs font-mono">{item.sqlContent}</code>
                      {item.errorMessage && (
                        <span className="text-red-500 dark:text-red-400 text-xs mt-0.5 block truncate">{item.errorMessage}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{badge(item.resultType)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${dialectInfo.cls}`}>
                        {dialectInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 tabular-nums">
                      {item.rowCount !== null ? item.rowCount.toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs">{item.executedAt}</td>
                  </tr>
                  {expandedId === item.id && (
                    <tr key={`${item.id}-detail`} className="bg-gray-50 dark:bg-gray-900/50">
                      <td colSpan={7} className="px-4 py-3">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">전체 SQL</p>
                        <pre className="text-xs font-mono bg-gray-900 text-green-400 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
                          {item.sqlContent}
                        </pre>
                        {item.errorMessage && (
                          <>
                            <p className="text-xs font-medium text-red-500 dark:text-red-400 mt-2 mb-1">오류 메시지</p>
                            <p className="text-xs text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg p-2">{item.errorMessage}</p>
                          </>
                        )}
                      </td>
                    </tr>
                  )}
                </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            이전
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={[
                  'w-9 h-9 text-sm rounded-lg border transition-colors',
                  p === page
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
                ].join(' ')}
              >
                {p + 1}
              </button>
            );
          })}
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
