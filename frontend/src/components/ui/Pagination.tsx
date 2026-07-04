'use client';

import React from 'react';

interface PaginationProps {
  /** 현재 페이지 (0-based) */
  page: number;
  /** 전체 페이지 수 */
  totalPages: number;
  /** 페이지 변경 콜백 (0-based) */
  onChange: (page: number) => void;
  className?: string;
}

/**
 * Pagination — 관리자 목록 표 공용 페이지네이션.
 *
 * 첫 페이지(0)·마지막 페이지(totalPages-1)는 항상 표시하고, 현재 page 기준 ±2 범위를 표시한다.
 * 표시 페이지 목록에서 인접 인덱스 차이가 1보다 크면 그 사이에 생략부호(…) 1개를 삽입한다.
 * totalPages가 1 이하면 아무것도 렌더링하지 않는다.
 */
export function Pagination({ page, totalPages, onChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i).filter(
    (i) => i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 2,
  );

  const items = pages.reduce<(number | 'ellipsis')[]>((acc, i, idx, arr) => {
    if (idx > 0 && i - arr[idx - 1] > 1) acc.push('ellipsis');
    acc.push(i);
    return acc;
  }, []);

  const arrowClass =
    'w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 ' +
    'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 ' +
    'disabled:opacity-30 disabled:cursor-not-allowed transition';

  return (
    <div className={['flex items-center justify-center gap-1', className ?? ''].join(' ').trim()}>
      <button
        type="button"
        onClick={() => onChange(Math.max(0, page - 1))}
        disabled={page === 0}
        aria-label="이전 페이지"
        className={arrowClass}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {items.map((item, idx) =>
        item === 'ellipsis' ? (
          <span key={`ellipsis-${idx}`} className="w-8 text-center text-gray-400 dark:text-gray-500 text-xs">
            …
          </span>
        ) : (
          <button
            type="button"
            key={item}
            onClick={() => onChange(item)}
            className={[
              'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition',
              page === item
                ? 'bg-indigo-600 text-white'
                : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
            ].join(' ')}
          >
            {item + 1}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
        disabled={page === totalPages - 1}
        aria-label="다음 페이지"
        className={arrowClass}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
