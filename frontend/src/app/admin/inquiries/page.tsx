'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { inquiryService } from '@/services/inquiryService';
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

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | ''>('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [holding, setHolding] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    inquiryService
      .adminGetAll(page, pageSize, statusFilter || undefined)
      .then((res) => {
        if (res.data.success && res.data.data) {
          setInquiries(res.data.data.content);
          setTotalPages(res.data.data.totalPages);
          setTotalElements(res.data.data.totalElements);
        }
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, statusFilter]);

  useEffect(() => { setPage(0); }, [statusFilter, pageSize]);
  useEffect(() => { load(); }, [load]);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    if (!confirm('이 문의를 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.')) return;
    setDeleting(id);
    try {
      await inquiryService.adminDelete(id);
      setInquiries((prev) => prev.filter((q) => q.id !== id));
      setTotalElements((prev) => prev - 1);
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleHold = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    setHolding(id);
    try {
      const res = await inquiryService.adminToggleHold(id);
      if (res.data.success && res.data.data) {
        setInquiries((prev) => prev.map((q) => (q.id === id ? res.data.data! : q)));
      }
    } finally {
      setHolding(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">1:1 문의 관리</h2>
        <p className="text-sm text-gray-500 mt-0.5">사용자의 1:1 문의를 확인하고 답변합니다.</p>
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
          <div className="p-12 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : inquiries.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">문의가 없습니다.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-12 whitespace-nowrap">No.</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">제목</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-24 whitespace-nowrap">유형</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-24 whitespace-nowrap">작성자</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-24 whitespace-nowrap">상태</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-28 whitespace-nowrap">등록일</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-24 whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inquiries.map((inquiry, idx) => (
                <tr key={inquiry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {page * pageSize + idx + 1}
                  </td>
                  <td className="px-4 py-3 font-medium max-w-xs">
                    <Link
                      href={`/admin/inquiries/${inquiry.id}`}
                      className="text-gray-900 hover:text-indigo-600 transition-colors truncate block"
                    >
                      {inquiry.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {INQUIRY_TYPE_LABEL[inquiry.inquiryType]}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {inquiry.userName}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLOR[inquiry.status]].join(' ')}>
                      {INQUIRY_STATUS_LABEL[inquiry.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {inquiry.createdAt?.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-1.5">
                      {inquiry.status !== 'ANSWERED' && (
                        <button
                          onClick={(e) => handleToggleHold(e, inquiry.id)}
                          disabled={holding === inquiry.id}
                          className={[
                            'px-2.5 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50',
                            inquiry.status === 'ON_HOLD'
                              ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                          ].join(' ')}
                        >
                          {inquiry.status === 'ON_HOLD' ? '대기로' : '보류'}
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(e, inquiry.id)}
                        disabled={deleting === inquiry.id}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        {deleting === inquiry.id ? '삭제 중' : '삭제'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
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
