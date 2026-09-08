'use client';

import { Pagination } from '@/components/ui/Pagination';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

interface ListPaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  scrollTargetId?: string;
}

export function ListPagination({
  page,
  totalPages,
  totalElements,
  pageSize,
  onChange,
  onPageSizeChange,
  scrollTargetId,
}: ListPaginationProps) {
  const rangeStart = totalElements === 0 ? 0 : page * pageSize + 1;
  const rangeEnd = Math.min((page + 1) * pageSize, totalElements);

  const scrollToList = () => {
    if (!scrollTargetId) return;
    document.getElementById(scrollTargetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePageChange = (nextPage: number) => {
    onChange(nextPage);
    scrollToList();
  };

  const handlePageSizeChange = (value: string) => {
    onPageSizeChange?.(Number(value));
    scrollToList();
  };

  return (
    <nav aria-label="목록 페이지네이션" className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center justify-between gap-3 text-sm text-gray-500 dark:text-gray-400">
        <span>{totalElements === 0 ? '0' : `${rangeStart}-${rangeEnd}`} / 전체 {totalElements}건</span>
        {onPageSizeChange && (
          <label className="flex items-center gap-2">
            <span>페이지당</span>
            <select
              aria-label="페이지당 항목 수"
              value={pageSize}
              onChange={event => handlePageSizeChange(event.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              {PAGE_SIZE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}개</option>
              ))}
            </select>
          </label>
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
    </nav>
  );
}
