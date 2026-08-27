'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { inquiryService } from '@/services/inquiryService';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useColumnResize } from '@/lib/useColumnResize';
import { ColResizeHandle } from '@/components/ui/ColResizeHandle';
import { Pagination } from '@/components/ui/Pagination';
import type { Inquiry, InquiryStatus, InquiryType } from '@/types';
import { INQUIRY_STATUS_LABEL, INQUIRY_TYPE_LABEL } from '@/types';

const INQUIRY_TYPE_OPTIONS = Object.keys(INQUIRY_TYPE_LABEL) as InquiryType[];

const STATUS_TABS: { label: string; value: InquiryStatus | '' }[] = [
  { label: '전체', value: '' },
  { label: '답변 대기', value: 'PENDING' },
  { label: '답변 보류', value: 'ON_HOLD' },
  { label: '답변 완료', value: 'ANSWERED' },
];

const STATUS_COLOR: Record<InquiryStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  ON_HOLD: 'bg-gray-100 text-gray-600',
  ANSWERED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-green-100 text-green-700',
  UNABLE_TO_PROCESS: 'bg-red-100 text-red-700',
};

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

// ── Inner component (useSearchParams 사용) ────────────────────────────────────
function AdminInquiriesContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type');

  const [allInquiries, setAllInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | ''>('');
  const [typeFilter, setTypeFilter]     = useState<InquiryType | ''>(
    initialType && (INQUIRY_TYPE_OPTIONS as string[]).includes(initialType) ? (initialType as InquiryType) : ''
  );
  const [page, setPage]                 = useState(0);
  const [pageSize, setPageSize]         = useState<10 | 20 | 50>(10);
  const [holding, setHolding]           = useState<number | null>(null);
  const [deleting, setDeleting]         = useState<number | null>(null);

  // 검색 조건 (입력)
  const [keyword, setKeyword]               = useState('');
  // 검색 조건 (적용됨)
  const [appliedKeyword, setAppliedKeyword] = useState('');

  // 관리 컬럼(보류/삭제 버튼) 클리핑 방지 위해 120→160 확대 + localStorage 키 v2 갱신
  const { widths, startResize } = useColumnResize(
    'tpmp:admin-inquiries:col-widths:v2',
    [48, 280, 96, 100, 96, 100, 160],
  );

  useEffect(() => {
    setLoading(true);
    inquiryService
      .adminGetAll(0, 10000, undefined)
      .then((res) => {
        if (res.data.success && res.data.data) setAllInquiries(res.data.data.content);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = () => { setAppliedKeyword(keyword); setPage(0); };
  const handleReset  = () => { setKeyword(''); setAppliedKeyword(''); setTypeFilter(''); setPage(0); };

  const handleStatusChange = (s: InquiryStatus | '') => { setStatusFilter(s); setPage(0); };
  const handleTypeChange = (t: InquiryType | '') => { setTypeFilter(t); setPage(0); };
  const handlePageSizeChange = (s: 10 | 20 | 50) => { setPageSize(s); setPage(0); };

  const filtered = useMemo(() => {
    let result = allInquiries;
    if (statusFilter) result = result.filter((i) => i.status === statusFilter);
    if (typeFilter) result = result.filter((i) => (i.inquiryType ?? i.requestType) === typeFilter);
    if (appliedKeyword) {
      const kw = appliedKeyword.toLowerCase();
      result = result.filter((i) =>
        i.title.toLowerCase().includes(kw) || (i.userName ?? '').toLowerCase().includes(kw)
      );
    }
    return result;
  }, [allInquiries, statusFilter, typeFilter, appliedKeyword]);

  const totalElements = filtered.length;
  const totalPages    = Math.ceil(totalElements / pageSize);
  const paged         = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    if (!confirm('이 문의를 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.')) return;
    setDeleting(id);
    try {
      await inquiryService.adminDelete(id);
      setAllInquiries((prev) => prev.filter((i) => i.id !== id));
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
        setAllInquiries((prev) => prev.map((i) => (i.id === id ? res.data.data! : i)));
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
            onClick={() => handleStatusChange(tab.value)}
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

      {/* 검색 조건 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-500 mb-1">제목 / 작성자</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="제목 또는 작성자 검색"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">유형</label>
            <select
              value={typeFilter}
              onChange={(e) => handleTypeChange(e.target.value as InquiryType | '')}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            >
              <option value="">전체</option>
              {INQUIRY_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{INQUIRY_TYPE_LABEL[t]}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
          >
            검색
          </button>
          {(keyword || appliedKeyword || typeFilter) && (
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-200 text-gray-500 rounded-lg text-sm hover:bg-gray-50 transition"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : allInquiries.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">문의가 없습니다.</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">검색 결과가 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <colgroup>{widths.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap relative">No.<ColResizeHandle onMouseDown={(e) => startResize(0, e)} /></th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 relative">제목<ColResizeHandle onMouseDown={(e) => startResize(1, e)} /></th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap relative">유형<ColResizeHandle onMouseDown={(e) => startResize(2, e)} /></th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap relative">작성자<ColResizeHandle onMouseDown={(e) => startResize(3, e)} /></th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap relative">상태<ColResizeHandle onMouseDown={(e) => startResize(4, e)} /></th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap relative">등록일<ColResizeHandle onMouseDown={(e) => startResize(5, e)} /></th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.map((inquiry, idx) => (
                <tr key={inquiry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {page * pageSize + idx + 1}
                  </td>
                  <td className="px-4 py-3 font-medium overflow-hidden">
                    <Link
                      href={`/admin/inquiries/${inquiry.id}`}
                      className="text-gray-900 hover:text-indigo-600 transition-colors truncate block"
                    >
                      {inquiry.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {INQUIRY_TYPE_LABEL[inquiry.inquiryType ?? inquiry.requestType]}
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
          </div>
        )}
      </div>

      {/* Footer */}
      {!loading && totalElements > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>페이지당</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value) as 10 | 20 | 50)}
              className="border border-gray-200 rounded-md px-2 py-1 text-sm"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}개</option>
              ))}
            </select>
            <span>/ 총 {totalElements}건</span>
          </div>

          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}

// ── Page export (Suspense 경계) ───────────────────────────────────────────────
export default function AdminInquiriesPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={5} cols={5} />}>
      <AdminInquiriesContent />
    </Suspense>
  );
}
