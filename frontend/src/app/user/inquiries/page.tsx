'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { inquiryService } from '@/services/inquiryService';
import { TableSkeleton } from '@/components/ui/Skeleton';
import type { Inquiry, InquiryStatus } from '@/types';
import { INQUIRY_STATUS_LABEL, INQUIRY_TYPE_LABEL } from '@/types';

const STATUS_TABS: { label: string; value: InquiryStatus | '' }[] = [
  { label: '전체', value: '' },
  { label: '답변 대기', value: 'PENDING' },
  { label: '답변 보류', value: 'ON_HOLD' },
  { label: '답변 완료', value: 'ANSWERED' },
];

const STATUS_COLOR: Record<InquiryStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ON_HOLD: 'bg-gray-100 text-gray-600',
  ANSWERED: 'bg-green-100 text-green-700',
};

export default function UserInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | ''>('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [statusFilter, pageSize]);

  useEffect(() => {
    setLoading(true);
    inquiryService
      .getMyInquiries(page, pageSize, statusFilter || undefined)
      .then((res) => {
        if (res.data.success && res.data.data) {
          setInquiries(res.data.data.content);
          setTotalPages(res.data.data.totalPages);
          setTotalElements(res.data.data.totalElements);
        }
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">1:1 문의</h2>
          <p className="text-sm text-gray-500 mt-0.5">내가 등록한 문의 목록입니다.</p>
        </div>
        <Link
          href="/user/inquiries/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          문의 등록
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={[
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              statusFilter === tab.value
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : inquiries.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">등록된 문의가 없습니다.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-12 whitespace-nowrap">No.</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">제목</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-24 whitespace-nowrap">유형</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-24 whitespace-nowrap">상태</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-28 whitespace-nowrap">등록일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inquiries.map((inquiry, idx) => (
                <tr
                  key={inquiry.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {page * pageSize + idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/user/inquiries/${inquiry.id}`}
                      className="text-gray-900 hover:text-indigo-600 font-medium transition-colors"
                    >
                      {inquiry.title}
                    </Link>
                    {inquiry.imageUrls?.length > 0 && (
                      <span className="ml-1.5 text-xs text-gray-400">
                        📎 {inquiry.imageUrls.length}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {INQUIRY_TYPE_LABEL[inquiry.inquiryType]}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLOR[inquiry.status]].join(' ')}>
                      {INQUIRY_STATUS_LABEL[inquiry.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {inquiry.createdAt?.slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer: page size + pagination */}
      {!loading && totalElements > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>페이지당</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border border-gray-200 rounded-md px-2 py-1 text-sm"
            >
              {[10, 20, 50].map((s) => (
                <option key={s} value={s}>{s}개</option>
              ))}
            </select>
            <span>/ 총 {totalElements}건</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => i)
              .filter((i) => Math.abs(i - page) <= 2 || i === 0 || i === totalPages - 1)
              .reduce<(number | '...')[]>((acc, i, idx, arr) => {
                if (idx > 0 && (i as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(i);
                return acc;
              }, [])
              .map((item, i) =>
                item === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-gray-400">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item as number)}
                    className={[
                      'w-8 h-8 rounded-lg text-sm transition-colors',
                      page === item
                        ? 'bg-indigo-600 text-white'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    {(item as number) + 1}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
