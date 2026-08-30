'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { getInquiryTargetAreaLabel } from '@/lib/inquiry';
import { inquiryService } from '@/services/inquiryService';
import type { InquiryStatus, InquirySummary } from '@/types';
import { INQUIRY_STATUS_LABEL, INQUIRY_TYPE_LABEL } from '@/types';

const STATUSES: (InquiryStatus | '')[] = [
  '',
  'PENDING',
  'IN_PROGRESS',
  'ON_HOLD',
  'ANSWERED',
  'COMPLETED',
  'UNABLE_TO_PROCESS',
];
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export default function UserInquiriesPage() {
  const [items, setItems] = useState<InquirySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<InquiryStatus | ''>('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    inquiryService
      .getMyInquiries(page, pageSize, status || undefined)
      .then((response) => {
        const result = response.data.data;
        setItems(result?.content ?? []);
        setTotalElements(result?.totalElements ?? 0);
        setTotalPages(result?.totalPages ?? 0);
      })
      .catch(() => {
        setItems([]);
        setTotalElements(0);
        setTotalPages(0);
        setError('문의·요청 목록을 불러오지 못했습니다.');
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, status]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">문의·요청</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            등록한 문의와 처리 요청을 확인하세요.
          </p>
        </div>
        <Link
          href="/user/inquiries/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
        >
          등록하기
        </Link>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        {STATUSES.map((value) => (
          <button
            key={value || 'all'}
            type="button"
            onClick={() => {
              setStatus(value);
              setPage(0);
            }}
            className={`shrink-0 rounded-md px-3 py-1.5 text-xs ${
              status === value
                ? 'bg-white text-indigo-700 shadow dark:bg-gray-700 dark:text-indigo-300'
                : 'text-gray-500'
            }`}
          >
            {value ? INQUIRY_STATUS_LABEL[value] : '전체'}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        {loading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : error ? (
          <p className="p-8 text-center text-sm text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <p className="p-12 text-center text-sm text-gray-400">
            등록된 문의·요청이 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/user/inquiries/${item.id}`}
                  className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex justify-between gap-3">
                    <strong className="text-sm text-gray-900 dark:text-gray-100">
                      {item.title}
                    </strong>
                    <span className="shrink-0 text-xs text-gray-400">
                      {item.createdAt.slice(0, 10)}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2 text-xs">
                    <span className="text-indigo-600 dark:text-indigo-400">
                      {INQUIRY_TYPE_LABEL[item.requestType]}
                    </span>
                    <span className="text-gray-500">{INQUIRY_STATUS_LABEL[item.status]}</span>
                    {item.targetArea && (
                      <span className="text-gray-400">
                        {getInquiryTargetAreaLabel(item.targetArea)}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!loading && totalElements > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            페이지당
            <select
              aria-label="페이지당"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value) as PageSize);
                setPage(0);
              }}
              className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size}개</option>
              ))}
            </select>
            <span>/ 총 {totalElements}건</span>
          </label>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
